// Technion admission-conditions collector — run in YOUR browser's DevTools console on admissions.technion.ac.il
// (any page; the site blocks automated clients, so it must run in your browser). Press ⌥⌘J, paste, Enter.
//
// 1. Finds the site's pages from its sitemap (WordPress: /wp-sitemap.xml or /sitemap_index.xml), falling back to the
//    links on the current page.
// 2. Fetches each page (same origin only, one request every 1.5 s) and keeps those that talk about admission
//    conditions — "תנאי קבלה", "דרישות", "מתמטיקה", "פיזיקה", "אנגלית", "סכם" — with their full text (including
//    collapsed tabs/accordions) and tables.
// 3. Downloads technion-admission-pages.json at the end.
// Progress is kept in localStorage: if the page reloads, paste again and it resumes. To start over:
// localStorage.removeItem('technionCollect'). Takes ~5–10 minutes.
(async () => {
	const KEY = 'technionCollect';
	const DELAY = 1500;
	const MAX_PAGES = 450;
	const RELEVANT = /תנאי ה?קבלה|דרישות|מתמטיקה|פיזיקה|אנגלית|סכם|בגרות/;
	const SKIP = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?)($|\?)|\/wp-(content|json|admin|includes)\/|\/(tag|author|feed)\//i;
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
	const same = (u) => { try { return new URL(u, location.href).origin === location.origin; } catch { return false; } };
	const norm = (u) => new URL(u, location.href).href.split('#')[0];
	const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
	const parse = (t, type = 'text/html') => new DOMParser().parseFromString(t, type);

	let state = JSON.parse(localStorage.getItem(KEY) || 'null');
	if (!state) {
		const urls = new Set();
		const sitemaps = ['/wp-sitemap.xml', '/sitemap_index.xml', '/sitemap.xml'];
		const queue = [...sitemaps];
		const seenMaps = new Set();
		while (queue.length) {
			const sm = queue.shift();
			if (seenMaps.has(sm)) continue;
			seenMaps.add(sm);
			try {
				const res = await fetch(sm, { credentials: 'include' });
				if (!res.ok) continue;
				const xml = parse(await res.text(), 'application/xml');
				for (const loc of xml.querySelectorAll('sitemap > loc')) queue.push(loc.textContent.trim());
				for (const loc of xml.querySelectorAll('url > loc')) {
					const u = loc.textContent.trim();
					if (same(u) && !SKIP.test(u)) urls.add(norm(u));
				}
			} catch (e) { console.log('sitemap failed', sm, e); }
			await sleep(DELAY);
		}
		for (const a of document.querySelectorAll('a[href]')) if (same(a.href) && !SKIP.test(a.href)) urls.add(norm(a.href));
		state = { startedAt: new Date().toISOString(), urls: [...urls].slice(0, MAX_PAGES), index: 0, pages: [], skipped: 0 };
		save(state);
		console.log(`Found ${urls.size} pages (keeping up to ${MAX_PAGES})`);
	}

	while (state.index < state.urls.length) {
		const url = state.urls[state.index];
		try {
			const res = await fetch(url, { credentials: 'include' });
			const doc = parse(await res.text());
			const main = doc.querySelector('main, article, .entry-content, #content') || doc.body;
			main.querySelectorAll('script, style, nav, footer, header, form').forEach((n) => n.remove());
			const text = clean(main.textContent);
			if (RELEVANT.test(text) && text.length > 200) {
				state.pages.push({
					url,
					status: res.status,
					title: clean(doc.title),
					text,
					tables: [...main.querySelectorAll('table')].map((t) => [...t.rows].map((r) => [...r.cells].map((c) => clean(c.textContent))))
				});
			} else state.skipped++;
		} catch (e) { state.pages.push({ url, error: String(e) }); }
		state.index++;
		save(state);
		if (state.index % 10 === 0) console.log(`[${state.index}/${state.urls.length}] kept ${state.pages.length}`);
		await sleep(DELAY);
	}

	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), ...state }, null, 1)], { type: 'application/json' }));
	a.download = 'technion-admission-pages.json';
	a.click();
	console.log(`Done: ${state.pages.length} relevant pages of ${state.urls.length} → technion-admission-pages.json. Reset: localStorage.removeItem('${KEY}')`);
})();

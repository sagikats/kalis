// Ariel "general admission conditions" collector — run in YOUR browser (DevTools console) on the ariel.ac.il
// "תנאי קבלה" page (or any department admission page), ⌥⌘J, paste, Enter.
// Links there are usually just "כאן", so this matches on the SURROUNDING text ("תנאי הקבלה הכלליים",
// "חישוב נתוני הקבלה", "בונוס", "ידיעון"...), follows them one level deeper, saves text + tables + HTML,
// and downloads the same-origin PDFs it finds. Downloads ariel-general-pages.json. One request every 2 s, max 30 pages.
(async () => {
  const DELAY = 2000, MAX_PAGES = 30, MAX_PDFS = 8;
  const RELEVANT = /תנאי ה?קבלה הכלליים|חישוב נתוני|חישוב ממוצע|בונוס|תוספת נקודות|ידיעון|שקלול|ציון קבלה משולב|מחשבון/;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const sameOrigin = (u) => { try { return new URL(u).origin === location.origin; } catch { return false; } };
  const norm = (u, base) => { try { return new URL(u, base).href.split('#')[0]; } catch { return null; } };
  const context = (a) => {
    let el = a;
    for (let i = 0; i < 3 && el.parentElement && clean(el.textContent).length < 25; i++) el = el.parentElement;
    return clean(el.textContent).slice(0, 200);
  };
  const linksOf = (doc, base) => [...doc.querySelectorAll('a[href]')]
    .map((a) => ({ text: clean(a.textContent), context: context(a), url: norm(a.getAttribute('href'), base) }))
    .filter((l) => l.url && /^https?:/.test(l.url) && (RELEVANT.test(l.text) || RELEVANT.test(l.context)));

  const seen = new Set([location.href.split('#')[0]]);
  const queue = linksOf(document, location.href).map((l) => ({ ...l, depth: 1 }));
  const pages = [], pdfs = [], external = [];
  console.log('Starting links:', queue.map((q) => `${q.context.slice(0, 60)} → ${q.url}`));

  while (queue.length && pages.length < MAX_PAGES) {
    const item = queue.shift();
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    if (/\.pdf($|\?)/i.test(item.url)) { pdfs.push(item); continue; }
    if (!sameOrigin(item.url)) { external.push(item); continue; }
    try {
      const res = await fetch(item.url, { credentials: 'include' });
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const main = doc.querySelector('main, article, .entry-content, #content') || doc.body;
      main.querySelectorAll('script, style').forEach((n) => n.remove());
      pages.push({
        ...item, status: res.status, title: clean(doc.title), text: clean(main.textContent), mainHtml: main.innerHTML,
        tables: [...main.querySelectorAll('table')].map((t) => [...t.rows].map((r) => [...r.cells].map((c) => clean(c.textContent)))),
        iframes: [...doc.querySelectorAll('iframe[src]')].map((f) => norm(f.getAttribute('src'), item.url)),
        allPdfLinks: [...main.querySelectorAll('a[href]')].map((a) => norm(a.getAttribute('href'), item.url)).filter((u) => u && /\.pdf/i.test(u)),
      });
      console.log(`[${pages.length}] (depth ${item.depth}) ${clean(doc.title)} → ${item.url}`);
      if (item.depth < 2) linksOf(doc, item.url).forEach((l) => { if (!seen.has(l.url)) queue.push({ ...l, depth: 2 }); });
      // PDFs on the general-conditions pages are worth keeping even if their link text is generic.
      pages[pages.length - 1].allPdfLinks.forEach((u) => { if (!seen.has(u) && !pdfs.some((p) => p.url === u)) pdfs.push({ url: u, text: '(pdf on page)', from: item.url }); });
    } catch (e) { pages.push({ ...item, error: String(e) }); }
    await sleep(DELAY);
  }

  for (const p of pdfs.filter((p) => sameOrigin(p.url)).slice(0, MAX_PDFS)) {
    try {
      const blob = await (await fetch(p.url, { credentials: 'include' })).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ariel-' + decodeURIComponent(p.url.split('/').pop().split('?')[0]);
      a.click();
      p.downloaded = true;
      console.log(`   PDF downloaded: ${p.url}`);
    } catch (e) { p.error = String(e); }
    await sleep(DELAY);
  }

  const out = { collectedAt: new Date().toISOString(), startPage: location.href, pages, pdfs, external, leftInQueue: queue.length };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-general-pages.json';
  a.click();
  console.log(`Done: ${pages.length} pages, ${pdfs.length} PDFs (${pdfs.filter((p) => p.downloaded).length} downloaded), ${external.length} external → ariel-general-pages.json`);
})();

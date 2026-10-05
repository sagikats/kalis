// Ariel bagrut-bonus / admission-calculation collector — run in YOUR browser (DevTools console) on ariel.ac.il.
// Start on the "תנאי קבלה" page (or any ariel.ac.il page), press ⌥⌘J, paste this, Enter.
// It follows links like "חישוב נתוני הקבלה", "מחשבון קבלה", "תנאי הקבלה הכלליים", "בונוס" (two levels deep),
// keeps each page's full HTML (tables included), its iframes, and the calculator's own JS (where the bonus
// table usually lives), and downloads ariel-bonus-pages.json. Same-origin PDFs found on the way are downloaded too.
// One request every 2 seconds, at most 40 pages.
(async () => {
  const DELAY = 2000;
  const MAX_PAGES = 40;
  const MAX_PDFS = 6;
  const RELEVANT = /חישוב נתוני|מחשבון|תנאי ה?קבלה הכלליים|בונוס|תוספת|שקלול|ממוצע (ה)?בגרות|ציון (ה)?התאמה|ציון משולב|סכם/;
  const LIB = /jquery|wp-includes|wp-emoji|gtag|googletagmanager|analytics|facebook|hotjar|recaptcha|elementor\/assets\/lib|wp-content\/plugins\/(?!.*calc)/i;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const sameOrigin = (u) => { try { return new URL(u).origin === location.origin; } catch { return false; } };
  const norm = (u, base) => { try { return new URL(u, base).href.split('#')[0]; } catch { return null; } };

  const linksOf = (doc, base) => [...doc.querySelectorAll('a[href]')]
    .map((a) => ({ text: clean(a.textContent), url: norm(a.getAttribute('href'), base) }))
    .filter((l) => l.url && /^https?:/.test(l.url));
  const relevant = (l) => RELEVANT.test(l.text) || /calc|bonus|%d7%97%d7%99%d7%a9%d7%95%d7%91|%d7%9e%d7%97%d7%a9%d7%91%d7%95%d7%9f/i.test(l.url);

  const seen = new Set([location.href.split('#')[0]]);
  const queue = linksOf(document, location.href).filter(relevant).map((l) => ({ ...l, depth: 1, from: location.href }));
  const pages = [];
  const external = [];
  const pdfs = [];
  const scripts = {};

  while (queue.length && pages.length < MAX_PAGES) {
    const item = queue.shift();
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    if (/\.pdf($|\?)/i.test(item.url)) { pdfs.push(item); continue; }
    if (!sameOrigin(item.url)) { external.push(item); continue; }
    try {
      const res = await fetch(item.url, { credentials: 'include' });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('main, article, .entry-content, #content') || doc.body;
      const scriptSrcs = [...doc.querySelectorAll('script[src]')].map((s) => norm(s.getAttribute('src'), item.url)).filter(Boolean);
      const inlineScripts = [...doc.querySelectorAll('script:not([src])')].map((s) => s.textContent)
        .filter((t) => t.length > 200 && !/gtag|dataLayer|fbq|wpemoji/i.test(t));
      const hasForm = !!main.querySelector('input, select');
      pages.push({
        ...item,
        status: res.status,
        title: clean(doc.title),
        text: clean(main.textContent),
        mainHtml: main.innerHTML,
        tables: [...main.querySelectorAll('table')].map((t) => [...t.rows].map((r) => [...r.cells].map((c) => clean(c.textContent)))),
        iframes: [...doc.querySelectorAll('iframe[src]')].map((f) => norm(f.getAttribute('src'), item.url)),
        hasForm,
        scriptSrcs,
        inlineScripts,
      });
      console.log(`[${pages.length}] (depth ${item.depth}) ${item.text || ''} → ${item.url}${hasForm ? '  [has form]' : ''}`);
      // Calculator pages: fetch their non-library same-origin scripts (the bonus table is usually in there).
      if (hasForm || /מחשבון|חישוב/.test(item.text + doc.title)) {
        for (const src of scriptSrcs.filter((s) => sameOrigin(s) && !LIB.test(s) && !(s in scripts))) {
          await sleep(DELAY);
          try { scripts[src] = await (await fetch(src, { credentials: 'include' })).text(); console.log(`   script ${src}`); }
          catch (e) { scripts[src] = `ERROR ${e}`; }
        }
      }
      if (item.depth < 2) {
        linksOf(doc, item.url).filter(relevant).forEach((l) => { if (!seen.has(l.url)) queue.push({ ...l, depth: item.depth + 1, from: item.url }); });
      }
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
      console.log(`   PDF downloaded: ${p.url}`);
    } catch (e) { p.error = String(e); }
    await sleep(DELAY);
  }

  const out = { collectedAt: new Date().toISOString(), startPage: location.href, pages, scripts, pdfs, external, leftInQueue: queue.length };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-bonus-pages.json';
  a.click();
  console.log(`Done: ${pages.length} pages, ${Object.keys(scripts).length} scripts, ${pdfs.length} PDFs, ${external.length} external links → ariel-bonus-pages.json`);
  if (external.length) console.log('External links (not fetched):', external.map((e) => e.url));
})();

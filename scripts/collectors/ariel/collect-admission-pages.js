// Ariel admission-conditions collector — run in YOUR browser (DevTools console) on ariel.ac.il.
// Start on https://www.ariel.ac.il/wp/bachelors-degree/ , press ⌥⌘J, paste this, Enter.
// Progress is kept in localStorage: if the page reloads or navigates, go back to the same page and paste it
// again — it continues where it stopped. At the end it downloads ariel-admission-pages.json.
// One request every 2 seconds, same-origin only. To start over: localStorage.removeItem('arielCollect')
(async () => {
  const KEY = 'arielCollect';
  const DELAY = 2000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const sameOrigin = (u) => { try { return new URL(u).origin === location.origin; } catch { return false; } };
  const isAdmission = (a) => /תנאי.{0,3}(ה)?קבלה/.test(clean(a.textContent)) || /%d7%aa%d7%a0%d7%90%d7%99/i.test(a.getAttribute('href') || '');
  const get = async (url) => {
    const res = await fetch(url, { credentials: 'include' });
    return { status: res.status, doc: new DOMParser().parseFromString(await res.text(), 'text/html') };
  };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));

  let state = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (!state) {
    const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.href.split('#')[0]).filter(sameOrigin);
    const roots = [...new Set(hrefs.map((u) => (u.match(/^(https:\/\/[^/]+\/wp\/[^/]+\/)/) || [])[1]).filter(Boolean))];
    const direct = [...document.querySelectorAll('a[href]')].filter(isAdmission).map((a) => a.href.split('#')[0]).filter(sameOrigin);
    state = { startPage: location.href, roots, rootIndex: 0, admission: [...new Set(direct)], pageIndex: 0, pages: [], skipped: [] };
    save(state);
  }
  console.log(`Resuming: ${state.rootIndex}/${state.roots.length} sites scanned, ${state.pages.length} pages collected`);

  while (state.rootIndex < state.roots.length) {
    const root = state.roots[state.rootIndex];
    try {
      const { doc } = await get(root);
      [...doc.querySelectorAll('a[href]')].filter(isAdmission).forEach((a) => {
        const u = new URL(a.getAttribute('href'), root).href.split('#')[0];
        if (!sameOrigin(u)) state.skipped.push(u);
        else if (!state.admission.includes(u)) state.admission.push(u);
      });
    } catch (e) { state.skipped.push(`${root} (${e})`); }
    state.rootIndex++;
    save(state);
    console.log(`[site ${state.rootIndex}/${state.roots.length}] ${root} — ${state.admission.length} admission pages found`);
    await sleep(DELAY);
  }

  while (state.pageIndex < state.admission.length) {
    const url = state.admission[state.pageIndex];
    try {
      const { status, doc } = await get(url);
      const main = doc.querySelector('main, article, .entry-content, #content') || doc.body;
      main.querySelectorAll('script, style, nav, footer, header').forEach((n) => n.remove());
      state.pages.push({ url, status, title: clean(doc.title), text: clean(main.textContent) });
    } catch (e) { state.pages.push({ url, error: String(e) }); }
    state.pageIndex++;
    save(state);
    console.log(`[page ${state.pageIndex}/${state.admission.length}] ${url}`);
    await sleep(DELAY);
  }

  const out = { collectedAt: new Date().toISOString(), ...state };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-admission-pages.json';
  a.click();
  console.log(`Done: ${state.pages.length} pages saved to ariel-admission-pages.json (run localStorage.removeItem('arielCollect') to reset)`);
})();

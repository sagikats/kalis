// Ariel grades-page dumper — run in the console of the calculator's GRADES page (after you filled the details form).
// IMPORTANT: the calculator is an iframe. In DevTools > Console, change the "top" dropdown to "pniot.ariel.ac.il"
// (or "NewMarkRecord.asp") first, then paste. Read-only: submits nothing, re-fetches nothing that posts data.
// Saves the rendered HTML, every field (with select options), all inline scripts and same-origin scripts,
// and the form's action. Downloads ariel-grades-dump.json.
(async () => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  if (!/pniot\.ariel\.ac\.il/.test(location.host)) { console.warn('Wrong context: switch the console dropdown from "top" to pniot.ariel.ac.il and paste again.'); return; }
  const LIB = /jquery|bootstrap|popper|gtag|googletagmanager|analytics|kramericaindustries|recaptcha|font-?awesome/i;
  const fields = [...document.querySelectorAll('input, select, textarea, button')].map((el) => ({
    tag: el.tagName.toLowerCase(), type: el.type, id: el.id, name: el.name, value: el.value,
    row: clean((el.closest('tr') || {}).textContent || '').slice(0, 80),
    options: el.tagName === 'SELECT' ? [...el.options].map((o) => ({ value: o.value, text: clean(o.textContent) })) : undefined,
    handlers: ['onchange', 'onclick', 'onblur', 'onkeyup'].map((h) => el.getAttribute(h) && `${h}: ${el.getAttribute(h)}`).filter(Boolean),
  }));
  const forms = [...document.forms].map((f) => ({ name: f.name, id: f.id, action: f.getAttribute('action'), method: f.method, onsubmit: f.getAttribute('onsubmit') }));
  const scripts = {};
  for (const src of [...new Set([...document.querySelectorAll('script[src]')].map((s) => s.src))]) {
    if (LIB.test(src)) { scripts[src] = '(library, skipped)'; continue; }
    try { scripts[src] = await (await fetch(src, { credentials: 'include' })).text(); console.log('script', src); }
    catch (e) { scripts[src] = `ERROR ${e}`; }
  }
  const inline = [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent);
  const out = {
    collectedAt: new Date().toISOString(), url: location.href, title: document.title,
    text: clean(document.body.innerText), renderedHtml: document.documentElement.outerHTML,
    forms, fields, scripts, inline,
    frames: [...document.querySelectorAll('iframe[src]')].map((f) => f.src),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-grades-dump.json';
  a.click();
  console.log(`Done: ${fields.length} fields, ${forms.length} forms, ${Object.keys(scripts).length} scripts, ${inline.length} inline → ariel-grades-dump.json`);
})();

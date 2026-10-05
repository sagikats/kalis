// Ariel calculator dumper — run in YOUR browser on https://pniot.ariel.ac.il/projects/tzmm/NewCalcMark/
// (open that URL in its own tab, ⌥⌘J, paste, Enter). Read-only: it saves the page's HTML (as rendered and as
// served), every form field with its options, and the source of all its same-origin scripts — the bonus table and
// the averaging rules usually live there. Downloads ariel-calc-dump.json. No form is submitted.
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const LIB = /jquery|bootstrap|popper|gtag|googletagmanager|analytics|kramericaindustries|recaptcha|font-?awesome/i;

  const fields = [...document.querySelectorAll('input, select, textarea, button')].map((el) => ({
    tag: el.tagName.toLowerCase(), type: el.type, id: el.id, name: el.name, value: el.value,
    label: clean((el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('aria-label') || el.placeholder || ''),
    options: el.tagName === 'SELECT' ? [...el.options].map((o) => ({ value: o.value, text: clean(o.textContent) })) : undefined,
    onchange: el.getAttribute('onchange') || el.getAttribute('onclick') || undefined,
  }));

  const served = await (await fetch(location.href, { credentials: 'include' })).text().catch((e) => `ERROR ${e}`);
  const srcs = [...new Set([...document.querySelectorAll('script[src]')].map((s) => s.src))];
  const scripts = {};
  for (const src of srcs) {
    if (LIB.test(src)) { scripts[src] = '(library, skipped)'; continue; }
    try { scripts[src] = await (await fetch(src, { credentials: 'include' })).text(); console.log('script', src); }
    catch (e) { scripts[src] = `ERROR ${e}`; }
    await sleep(1500);
  }
  const inline = [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent).filter((t) => !/rbzns|winsocks/.test(t));
  const frames = [...document.querySelectorAll('iframe[src]')].map((f) => f.src);
  // Global variables the page defined (bonus tables are sometimes plain arrays/objects on window).
  const baseline = new Set(Object.getOwnPropertyNames(document.createElement('iframe').contentWindow || {}));
  const globals = {};
  for (const k of Object.getOwnPropertyNames(window)) {
    if (baseline.has(k) || /^(on|webkit)/.test(k)) continue;
    const v = window[k];
    if (v && typeof v === 'object' && !(v instanceof Node)) { try { globals[k] = JSON.parse(JSON.stringify(v)); } catch {} }
    else if (typeof v === 'function' && !/\[native code\]/.test(String(v))) globals[k] = String(v);
  }

  const out = {
    collectedAt: new Date().toISOString(), url: location.href, title: document.title,
    text: clean(document.body.innerText), renderedHtml: document.documentElement.outerHTML, servedHtml: served,
    fields, scripts, inline, frames, globals,
    tables: [...document.querySelectorAll('table')].map((t) => [...t.rows].map((r) => [...r.cells].map((c) => clean(c.textContent)))),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-calc-dump.json';
  a.click();
  console.log(`Done: ${fields.length} fields, ${Object.keys(scripts).length} scripts, ${Object.keys(globals).length} globals, ${frames.length} frames → ariel-calc-dump.json`);
  if (frames.length) console.log('Nested frames:', frames);
})();

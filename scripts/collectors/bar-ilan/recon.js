// Bar-Ilan calculator — page snapshot (run in YOUR browser's DevTools console on shoham.biu.ac.il).
// Saves the current page (HTML + form structure) to a JSON file. No requests are sent.
(() => {
  const forms = [...document.forms].map((f) => ({
    id: f.id, name: f.name, action: f.getAttribute('action'), method: f.method,
    fields: [...f.elements].map((e) => ({
      tag: e.tagName.toLowerCase(), type: e.type, name: e.name, id: e.id,
      value: (e.value || '').length > 200 ? `[${e.value.length} chars]` : e.value,
      label: (e.labels && e.labels[0] ? e.labels[0].textContent : e.getAttribute('title') || e.getAttribute('placeholder') || '').trim(),
      options: e.tagName === 'SELECT' ? [...e.options].map((o) => [o.value, o.textContent.trim()]) : undefined
    }))
  }));
  const scripts = [...document.scripts].map((s) => s.src || `[inline ${s.textContent.length} chars]`);
  const out = { url: location.href, title: document.title, savedAt: new Date().toISOString(), forms, scripts, html: document.documentElement.outerHTML };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = `biu-page-${Date.now()}.json`;
  a.click();
  console.log(`Saved ${a.download}: ${forms.length} forms, ${forms.reduce((n, f) => n + f.fields.length, 0)} fields`);
})();

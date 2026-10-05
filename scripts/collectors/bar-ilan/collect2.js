// Bar-Ilan calculator — part C: formula sweep. Run in YOUR browser's DevTools console on shoham.biu.ac.il/kabala/Results.aspx
// Re-runs the psychometric step with ~38 profiles (sweeps of one value at a time) and reads 9 representative programs.
// One request every 1.5 seconds (~10 minutes). Resumes after a reload (paste again on Results.aspx).
// Downloads biu-formula-sweep.json at the end. To start over: localStorage.removeItem('biuCollect2')
(async () => {
  const KEY = 'biuCollect2';
  const DELAY = 1500;
  const BASE = location.origin + '/kabala/';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  const val = (doc, id) => doc.getElementById(id)?.getAttribute('value') || '';
  const text = (doc, id) => (doc.getElementById(id)?.textContent || '').replace(/\s+/g, ' ').trim();

  function formData(doc, extra) {
    const form = doc.getElementById('form1') || doc.forms[0];
    const fd = new URLSearchParams();
    for (const el of form.elements) {
      if (!el.name || ['submit', 'button', 'image'].includes(el.type)) continue;
      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
      fd.set(el.name, el.tagName === 'SELECT' ? (el.querySelector('option[selected]')?.value ?? el.options[0]?.value ?? '') : el.getAttribute('value') ?? '');
    }
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    return fd;
  }
  const post = async (page, fd) => parse(await (await fetch(BASE + page, { method: 'POST', body: fd, credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })).text());
  const get = async (page) => parse(await (await fetch(BASE + page, { credentials: 'include' })).text());

  // Representative programs, by their row id on the results page
  const SAMPLE = {
    ctl127: 'משפטים', ctl177: 'פסיכולוגיה חד חוגי', ctl107: 'מדעי המחשב חד חוגי', ctl64: 'כלכלה חד חוגי',
    ctl99: 'מדעי החיים חד חוגי', ctl168: 'פיזיקה חד חוגי', ctl02: 'אופטומטריה', ctl40: 'הנדסת חשמל', ctl45: 'הנדסת תוכנה'
  };
  const target = (ctl) => `ctl00$ContentPlaceHolder1$GridView1$${ctl}$lnkStatus`;

  const A = { bagrut: '112.08', mathUnits: '5', math: '95', engUnits: '5', eng: '92', psych: '714', quant: '145', physUnits: '5', phys: '93' };
  const PROFILES = [['A', {}]];
  for (const v of [500, 550, 600, 650, 700, 750, 800]) PROFILES.push([`psych ${v}`, { psych: String(v) }]);
  for (const v of [90, 95, 100, 105, 110, 115, 120]) PROFILES.push([`bagrut ${v}`, { bagrut: String(v) }]);
  for (const v of [100, 110, 120, 130, 140, 150]) PROFILES.push([`quant ${v}`, { quant: String(v) }]);
  for (const v of [60, 70, 80, 90, 100]) PROFILES.push([`math 5u ${v}`, { math: String(v) }]);
  PROFILES.push(['math 4u 80', { mathUnits: '4', math: '80' }], ['math 3u 95', { mathUnits: '3' }]);
  for (const v of [60, 70, 80, 100]) PROFILES.push([`physics 5u ${v}`, { phys: String(v) }]);
  PROFILES.push(['physics 4u 93', { physUnits: '4' }]);
  PROFILES.push(['psych 600 + bagrut 100', { psych: '600', bagrut: '100' }], ['psych 750 + bagrut 95', { psych: '750', bagrut: '95' }]);
  PROFILES.push(['psych 650 + quant 120', { psych: '650', quant: '120' }], ['english 60', { eng: '60' }]);

  const P = 'ctl00$ContentPlaceHolder1$';
  const psychFields = (p) => ({
    [P + 'txtBagrut']: p.bagrut, [P + 'ddlMath']: p.mathUnits, [P + 'txtMathGrade']: p.math,
    [P + 'ddlEnglishUnits']: p.engUnits, [P + 'txtEnglishGrade']: p.eng, [P + 'txtPsychmetric']: p.psych,
    [P + 'txtPsychmetricMath']: p.quant, [P + 'ddlPhysics']: p.physUnits, [P + 'txtPhysics']: p.phys,
    [P + 'ddlChemistry']: '0', [P + 'txtChemistry']: '', [P + 'ddlBiology']: '0', [P + 'txtBiology']: '',
    [P + 'btnCalc']: 'חשב', __EVENTTARGET: '', __EVENTARGUMENT: ''
  });

  const state = JSON.parse(localStorage.getItem(KEY) || 'null') || { runs: [] };
  for (let i = state.runs.length; i < PROFILES.length; i++) {
    const [label, change] = PROFILES[i];
    const profile = { ...A, ...change };
    const scores = {};
    try {
      const psychDoc = await get('Psychometric.aspx');
      await sleep(DELAY);
      const results = await post('Psychometric.aspx', formData(psychDoc, psychFields(profile)));
      for (const [ctl, name] of Object.entries(SAMPLE)) {
        await sleep(DELAY);
        const d = await post('Results.aspx', formData(results, { __EVENTTARGET: target(ctl), __EVENTARGUMENT: '' }));
        scores[ctl] = { name, popup: text(d, 'ContentPlaceHolder1_lblMaslul'), candidate: val(d, 'ContentPlaceHolder1_txtGrade'), status: val(d, 'ContentPlaceHolder1_txtStatus') };
      }
      state.runs.push({ label, profile, scores });
    } catch (e) { state.runs.push({ label, profile, error: String(e) }); }
    localStorage.setItem(KEY, JSON.stringify(state));
    console.log(`[C ${i + 1}/${PROFILES.length}] ${label}: ` + Object.values(scores).map((s) => s.candidate).join(' / '));
    await sleep(DELAY);
  }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), sample: SAMPLE, baseProfile: A, ...state }, null, 1)], { type: 'application/json' }));
  a.download = 'biu-formula-sweep.json';
  a.click();
  console.log(`Done: ${state.runs.length} profiles → biu-formula-sweep.json`);
})();

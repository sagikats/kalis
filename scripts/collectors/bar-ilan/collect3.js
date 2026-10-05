// Bar-Ilan calculator — part D: fine formula sweep. Run in YOUR browser's DevTools console on shoham.biu.ac.il/kabala/Results.aspx
// Re-runs the psychometric step with ~240 profiles (fine sweeps, one value at a time) and reads one program per scoring
// group. One request every 1.2 seconds (~25 minutes). Resumes after a reload (paste again on Results.aspx).
// Downloads biu-formula-sweep-fine.json at the end. To start over: localStorage.removeItem('biuCollect3')
(async () => {
  const KEY = 'biuCollect3';
  const DELAY = 1200;
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
  const SAMPLE = { ctl18: 'רב-תחומי במדעי הרוח (כללי)', ctl107: 'מדעי המחשב (מדעי)', ctl40: 'הנדסת חשמל', ctl45: 'הנדסת תוכנה' };
  const ALL = Object.keys(SAMPLE);
  const NOT_GENERAL = ['ctl107', 'ctl40', 'ctl45'];
  const target = (ctl) => `ctl00$ContentPlaceHolder1$GridView1$${ctl}$lnkStatus`;

  const A = { bagrut: '112.08', mathUnits: '5', math: '95', engUnits: '5', eng: '92', psych: '714', quant: '145', physUnits: '5', phys: '93' };
  // [label, change, programs to read]
  const PROFILES = [['A', {}, ALL]];
  for (let v = 400; v <= 800; v += 5) PROFILES.push([`psych ${v}`, { psych: String(v) }, ALL]);
  for (let v = 70; v <= 120; v += 1) PROFILES.push([`bagrut ${v}`, { bagrut: String(v) }, ALL]);
  for (let v = 50; v <= 150; v += 5) PROFILES.push([`quant ${v}`, { quant: String(v) }, NOT_GENERAL]);
  for (const u of ['5', '4', '3']) for (let v = 55; v <= 100; v += 5) PROFILES.push([`math ${u}u ${v}`, { mathUnits: u, math: String(v) }, NOT_GENERAL]);
  for (const u of ['5', '4', '3']) for (let v = 55; v <= 100; v += 5) PROFILES.push([`physics ${u}u ${v}`, { physUnits: u, phys: String(v) }, ['ctl40']]);
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
    const [label, change, programs] = PROFILES[i];
    const profile = { ...A, ...change };
    const scores = {};
    try {
      const psychDoc = await get('Psychometric.aspx');
      await sleep(DELAY);
      const results = await post('Psychometric.aspx', formData(psychDoc, psychFields(profile)));
      for (const ctl of programs) {
        const name = SAMPLE[ctl];
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
  a.download = 'biu-formula-sweep-fine.json';
  a.click();
  console.log(`Done: ${state.runs.length} profiles → biu-formula-sweep-fine.json`);
})();

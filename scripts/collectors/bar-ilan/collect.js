// Bar-Ilan calculator collector — run in YOUR browser's DevTools console on shoham.biu.ac.il/kabala/Results.aspx
// (after entering profile A by hand and reaching the results page).
// Part A: opens every program's details (score, acceptance/rejection thresholds, minimum requirements).
// Part B: re-runs the psychometric step with ~16 profiles (one change each) and reads the score of one program
// per scoring group, to fit Bar-Ilan's formula. One request every 1.5 seconds.
// Progress is kept in localStorage: if the page reloads, open Results.aspx again and paste again — it resumes.
// At the end it downloads biu-calculator-data.json. To start over: localStorage.removeItem('biuCollect')
(async () => {
  const KEY = 'biuCollect';
  const DELAY = 1500;
  const BASE = location.origin + '/kabala/';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  const text = (doc, id) => (doc.getElementById(id)?.textContent || '').replace(/\s+/g, ' ').trim();
  const val = (doc, id) => doc.getElementById(id)?.getAttribute('value') || '';

  /** Form fields of a parsed page, ready to post (submit buttons excluded unless named in `extra`). */
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
  async function post(page, fd) {
    const res = await fetch(BASE + page, { method: 'POST', body: fd, credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return { url: res.url, doc: parse(await res.text()) };
  }
  async function get(page) {
    const res = await fetch(BASE + page, { credentials: 'include' });
    return parse(await res.text());
  }
  function rowsOf(doc) {
    return [...doc.querySelectorAll('a[id^="ContentPlaceHolder1_GridView1_lnkStatus_"]')].map((a) => {
      const tds = a.closest('tr').querySelectorAll('td');
      return {
        program: tds[0].textContent.trim(),
        department: tds[1].textContent.trim(),
        status: a.textContent.trim(),
        registration: (tds[3]?.textContent || '').trim(),
        target: (a.getAttribute('href').match(/__doPostBack\('([^']+)'/) || [])[1]
      };
    });
  }
  async function details(resultsDoc, row) {
    const { doc } = await post('Results.aspx', formData(resultsDoc, { __EVENTTARGET: row.target, __EVENTARGUMENT: '' }));
    return {
      program: text(doc, 'ContentPlaceHolder1_lblMaslul') || row.program,
      department: text(doc, 'ContentPlaceHolder1_lblDepartment'),
      scope: text(doc, 'ContentPlaceHolder1_lblScope'),
      status: val(doc, 'ContentPlaceHolder1_txtStatus'),
      candidate: val(doc, 'ContentPlaceHolder1_txtGrade'),
      accept: val(doc, 'ContentPlaceHolder1_txtAcceptanceWeightedGrade'),
      reject: val(doc, 'ContentPlaceHolder1_txtRejectionWeightedGrade'),
      remarks: text(doc, 'ContentPlaceHolder1_lblOnlineRegistrationRemark')
    };
  }

  // Profile A and one-change variants (psychometric step only; the bagrut average is entered there directly)
  const A = { bagrut: '112.08', mathUnits: '5', math: '95', engUnits: '5', eng: '92', psych: '714', quant: '145', physUnits: '5', phys: '93', chemUnits: '0', chem: '', bioUnits: '0', bio: '' };
  const PROFILES = [
    ['A', {}], ['psych 680', { psych: '680' }], ['psych 600', { psych: '600' }], ['quant 135', { quant: '135' }],
    ['quant 125', { quant: '125' }], ['bagrut 105', { bagrut: '105' }], ['bagrut 100', { bagrut: '100' }],
    ['math 85', { math: '85' }], ['math 4u 95', { mathUnits: '4' }], ['english 82', { eng: '82' }],
    ['english 4u 92', { engUnits: '4' }], ['physics 83', { phys: '83' }], ['no physics', { physUnits: '0', phys: '' }],
    ['chemistry 5u 90, no physics', { physUnits: '0', phys: '', chemUnits: '5', chem: '90' }],
    ['biology 5u 90, no physics', { physUnits: '0', phys: '', bioUnits: '5', bio: '90' }],
    ['no psychometric', { psych: '', quant: '' }]
  ];
  const P = 'ctl00$ContentPlaceHolder1$';
  const psychFields = (p) => ({
    [P + 'txtBagrut']: p.bagrut, [P + 'ddlMath']: p.mathUnits, [P + 'txtMathGrade']: p.math,
    [P + 'ddlEnglishUnits']: p.engUnits, [P + 'txtEnglishGrade']: p.eng, [P + 'txtPsychmetric']: p.psych,
    [P + 'txtPsychmetricMath']: p.quant, [P + 'ddlPhysics']: p.physUnits, [P + 'txtPhysics']: p.phys,
    [P + 'ddlChemistry']: p.chemUnits, [P + 'txtChemistry']: p.chem, [P + 'ddlBiology']: p.bioUnits, [P + 'txtBiology']: p.bio,
    [P + 'btnCalc']: 'חשב', __EVENTTARGET: '', __EVENTARGUMENT: ''
  });

  let state = JSON.parse(localStorage.getItem(KEY) || 'null') || { programs: [], profileIndex: 0, runs: [] };

  // Part A — every program, profile A (the page you are on)
  let resultsDoc = await get('Results.aspx');
  const rows = rowsOf(resultsDoc);
  if (!rows.length) { console.error('No programs table — open Results.aspx after calculating profile A, then paste again.'); return; }
  for (let i = state.programs.length; i < rows.length; i++) {
    try { state.programs.push({ ...rows[i], ...(await details(resultsDoc, rows[i])) }); }
    catch (e) { state.programs.push({ ...rows[i], error: String(e) }); }
    save(state);
    console.log(`[A ${i + 1}/${rows.length}] ${rows[i].program}: ${state.programs[i].candidate} (accept ${state.programs[i].accept})`);
    await sleep(DELAY);
  }

  // One program per scoring group (same profile-A score), plus a few anchors
  const anchors = ['משפטים', 'מדעי המחשב - חד חוגי', 'הנדסת חשמל', 'פסיכולוגיה - חד חוגי', 'כלכלה - חד חוגי'];
  const pick = new Map();
  for (const p of state.programs) {
    if (!p.candidate) continue;
    if (!pick.has(p.candidate) || anchors.some((a) => p.program.startsWith(a))) pick.set(p.candidate, p.program);
  }
  for (const p of state.programs) if (anchors.some((a) => p.program.startsWith(a))) pick.set('anchor:' + p.program, p.program);
  const sample = [...new Set(pick.values())].slice(0, 30);
  console.log(`Part B: ${PROFILES.length} profiles × ${sample.length} programs`);

  // Part B — one-change profiles
  for (; state.profileIndex < PROFILES.length; state.profileIndex++) {
    const [label, change] = PROFILES[state.profileIndex];
    const profile = { ...A, ...change };
    try {
      const psychDoc = await get('Psychometric.aspx');
      await sleep(DELAY);
      const { doc } = await post('Psychometric.aspx', formData(psychDoc, psychFields(profile)));
      resultsDoc = doc;
      const byName = new Map(rowsOf(resultsDoc).map((r) => [r.program, r]));
      const scores = {};
      for (const name of sample) {
        const row = byName.get(name);
        if (!row) { scores[name] = null; continue; }
        await sleep(DELAY);
        const d = await details(resultsDoc, row);
        scores[name] = { candidate: d.candidate, status: d.status };
      }
      state.runs.push({ label, profile, scores });
    } catch (e) { state.runs.push({ label, profile, error: String(e) }); }
    save({ ...state, profileIndex: state.profileIndex + 1 });
    console.log(`[B ${state.profileIndex + 1}/${PROFILES.length}] ${label}`);
    await sleep(DELAY);
  }

  const out = { collectedAt: new Date().toISOString(), baseProfile: A, ...state };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'biu-calculator-data.json';
  a.click();
  console.log(`Done: ${state.programs.length} programs, ${state.runs.length} profile runs → biu-calculator-data.json`);
})();

// Ariel bonus-table sweep — run in the console of the calculator GRADES page, in the pniot.ariel.ac.il context
// (DevTools > Console > change "top" to pniot.ariel.ac.il). It fills the page's own form with ~22 planned grade
// profiles and submits it (exactly like clicking "חשב") into a hidden frame, one every 3 s, saving each result page.
// Stops at the first error. Downloads ariel-bonus-sweep.json.
(async () => {
  if (!/pniot\.ariel\.ac\.il/.test(location.host)) { console.warn('Switch the console dropdown from "top" to pniot.ariel.ac.il and paste again.'); return; }
  const DELAY = 3000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const form = document.NewRecord;
  const ACTION = 'CalcMark.asp?lm_form=10862&lm_supplier=7395&lm_key=34cefc833a&quick=False';
  // Mandatory rows 1–7 (fixed by the page): civics, English, history, math, Hebrew, Bible, literature.
  const ROW = { civ: 1, eng: 2, hist: 3, math: 4, heb: 5, tan: 6, lit: 7 };
  const CODE = { phys: '43', bio: '17', chem: '60', cs: '67', geo: '50', socsci: '22' };
  const base = { civ: [2, 80], eng: [3, 80], hist: [2, 80], math: [3, 80], heb: [2, 80], tan: [2, 80], lit: [2, 80] };
  const P = (name, mand, electives, psych = [650, 650]) => ({ name, mand: { ...base, ...mand }, electives, psych });
  const profiles = [
    P('math4 80', { math: [4, 80] }, [['phys', 5, 80]]),
    P('math5 80', { math: [5, 80] }, [['phys', 5, 80]]),
    P('math5 100', { math: [5, 100] }, [['phys', 5, 80]]),
    P('math4 100', { math: [4, 100] }, [['phys', 5, 80]]),
    P('math5 60', { math: [5, 60] }, [['phys', 5, 80]]),
    P('hist5', { hist: [5, 80] }, [['phys', 5, 80]]),
    P('lit5', { lit: [5, 80] }, [['phys', 5, 80]]),
    P('tan5', { tan: [5, 80] }, [['phys', 5, 80]]),
    P('+chem3', {}, [['phys', 5, 80], ['chem', 3, 80]]),
    P('phys5 grade 60', {}, [['phys', 5, 60]]),
    P('all 100, math5 eng5 phys5', { civ: [2, 100], eng: [5, 100], hist: [2, 100], math: [5, 100], heb: [2, 100], tan: [2, 100], lit: [2, 100] }, [['phys', 5, 100]]),
    P('lit2 grade 60, +bio2 80 (lit dropped?)', { lit: [2, 60] }, [['phys', 5, 80], ['bio', 2, 80]]),
    P('tan2 grade 60, +bio2 80 (tanakh dropped?)', { tan: [2, 60] }, [['phys', 5, 80], ['bio', 2, 80]]),
  ];

  // Submit the page's REAL form (same encoding as clicking "חשב") into a hidden same-origin iframe and read the
  // result from there.
  const frame = document.createElement('iframe');
  frame.name = 'sweepFrame'; frame.style.display = 'none';
  document.body.appendChild(frame);
  const setVal = (name, v) => { const el = form.elements[name]; if (el) { el.disabled = false; el.value = v; } };
  const results = [];
  for (const [i, p] of profiles.entries()) {
    for (const [k, r] of Object.entries(ROW)) { setVal(`txtNumberUnits${r}`, p.mand[k][0]); setVal(`txtNumberMark${r}`, p.mand[k][1]); }
    for (let r = 8; r <= 12; r++) {
      const e = p.electives[r - 8];
      setVal(`txtNameMikc${r}`, e ? CODE[e[0]] : '0');
      setVal(`txtNumberMikc${r}`, e ? CODE[e[0]] : '');
      // Like a user who never touched an unused row: units/grade stay empty.
      setVal(`txtNumberUnits${r}`, e ? e[1] : '');
      setVal(`txtNumberMark${r}`, e ? e[2] : '');
    }
    setVal('txtNumberPsico', p.psych[0]); setVal('txtNumberQuantitative', p.psych[1]);
    form.elements.checkDeclaration1.checked = true;
    setVal('txtAllMikc', 7 + p.electives.length); setVal('txtMinFields', 7);
    // Blank the frame first, then wait until it actually shows the CalcMark.asp result (not about:blank).
    try { frame.contentDocument.open(); frame.contentDocument.close(); } catch {}
    form.method = 'post'; form.action = ACTION; form.target = 'sweepFrame';
    form.submit();
    let text = '', html = '', at = '';
    for (let t = 0; t < 60; t++) {
      await sleep(500);
      try {
        const d = frame.contentDocument;
        at = frame.contentWindow.location.href;
        if (/CalcMark/i.test(at) && d.readyState === 'complete' && d.body && clean(d.body.innerText)) {
          await sleep(1000); // let any onload script fill the result
          html = d.documentElement.outerHTML; text = clean(d.body.innerText); break;
        }
      } catch (e) { text = `ERROR reading result: ${e}`; break; }
    }
    if (!text) text = `ERROR no result after 30 s (frame at ${at})`;
    results.push({ ...p, text, at, html: i < 2 ? html : undefined });
    console.log(`[${i + 1}/${profiles.length}] ${p.name}: ${text.slice(0, 160)}`);
    if (i === 0 && /Server Error/.test(text)) { console.warn('First profile failed — stopping. Send the downloaded file to Claude.'); break; }
    await sleep(DELAY);
  }
  form.target = '';

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), program: form.selDefaultMik.value, results }, null, 1)], { type: 'application/json' }));
  a.download = 'ariel-bonus-sweep.json';
  a.click();
  console.log('Done → ariel-bonus-sweep.json');
})();

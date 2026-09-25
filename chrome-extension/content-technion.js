// Kalis Content Script: Technion Calculator AutoFill
// Target: admissions.technion.ac.il/calculator/*

(async function () {
  console.log('[Kalis Extension] Technion script active. Frame:', window.self === window.top ? 'top' : 'iframe');

  // Check if we have pending verification data
  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis Extension] Error reading storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  // Verify expiry (within 15 minutes)
  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) {
    chrome.storage.local.remove('pendingVerification');
    return;
  }

  const isTopWindow = window.self === window.top;

  // Banner UI Helper (only show on top window)
  let banner = null;
  const updateStatus = (text, isSuccess = false) => {
    if (!isTopWindow) return;
    const el = document.getElementById('kalis-banner-status');
    if (el) {
      el.textContent = text;
      if (isSuccess) {
        el.style.color = '#15803d';
        el.style.fontWeight = 'bold';
      }
    }
  };

  if (isTopWindow) {
    banner = document.createElement('div');
    banner.id = 'kalis-autofill-banner';
    banner.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      background: #FAF8F5;
      border: 2px solid #3C3C3C;
      border-radius: 16px;
      padding: 12px 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", sans-serif;
      direction: rtl;
      text-align: right;
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: 90vw;
      color: #222222;
      transition: all 0.3s ease;
    `;

    banner.innerHTML = `
      <div style="width: 36px; height: 36px; background: #3C3C3C; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 16px; flex-shrink: 0;">
        🎓
      </div>
      <div>
        <div style="font-weight: 800; font-size: 13px; color: #111;">סייען מתקבלים — מזין ציונים למחשבון הטכניון...</div>
        <div id="kalis-banner-status" style="font-size: 11px; color: #666; margin-top: 2px;">מתחבר לטופס המחשבון...</div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Polling helper to wait for elements
  const waitForElement = async (selector, timeout = 7000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  };

  // Helper to safely set input values and trigger change/input events
  const setInput = (input, val) => {
    if (!input) return;
    input.value = val;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    input.style.backgroundColor = '#EBF4EE';
    input.style.borderColor = '#22C55E';
    input.style.transition = 'background-color 0.5s ease';
  };

  const setSelect = (select, val) => {
    if (!select) return;
    const strVal = String(val);
    let matched = false;
    for (let opt of select.options) {
      if (opt.value === strVal || opt.text === strVal || opt.text.includes(strVal)) {
        select.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) select.value = strVal;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.style.backgroundColor = '#EBF4EE';
  };

  try {
    updateStatus('מאתר את טופס הבגרות במחשבון...');

    // 1. Wait for Bagrut form trigger (radio or direct table)
    const bagrotRadio = await waitForElement('#bagrotYes, input[name="bagrot"][value="yes"], #sehem_table, #english');
    if (bagrotRadio && bagrotRadio.id === 'bagrotYes') {
      bagrotRadio.checked = true;
      bagrotRadio.dispatchEvent(new Event('click', { bubbles: true }));
      bagrotRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const bagrotForm = document.getElementById('bagrotForm');
    if (bagrotForm) {
      bagrotForm.style.display = 'block';
    }

    // Short wait for form collapse animation
    await new Promise((r) => setTimeout(r, 350));

    // 2. Fill Mandatory Subjects
    updateStatus('מזין מקצועות חובה...');
    const subjects = pendingVerification.subjects || [];

    const findSubject = (keywords) => {
      return subjects.find((s) => keywords.some((k) => s.name.includes(k)));
    };

    let filledCount = 0;

    // English
    const engSub = findSubject(['אנגלית']);
    if (engSub) {
      setSelect(document.getElementById('yEnglish'), engSub.units >= 5 ? 5 : 4);
      setInput(document.getElementById('english'), engSub.grade);
      filledCount++;
    }

    // Math
    const mathSub = findSubject(['מתמטיקה']);
    if (mathSub) {
      setSelect(document.getElementById('yMathematic'), mathSub.units >= 5 ? 5 : 4);
      setInput(document.getElementById('mathematic'), mathSub.grade);
      filledCount++;
    }

    // Literature (ספרות עברית)
    const litSub = findSubject(['ספרות']);
    if (litSub) {
      setSelect(document.getElementById('yHebrew_lit'), litSub.units);
      setInput(document.getElementById('hebrew_lit'), litSub.grade);
      filledCount++;
    }

    // Bible (תנ"ך)
    const bibleSub = findSubject(['תנך', 'תנ"ך']);
    if (bibleSub) {
      setSelect(document.getElementById('yBible'), bibleSub.units);
      setInput(document.getElementById('bible'), bibleSub.grade);
      filledCount++;
    }

    // Civics (אזרחות)
    const ezrahutSub = findSubject(['אזרחות']);
    if (ezrahutSub) {
      setSelect(document.getElementById('yEzrahut'), ezrahutSub.units);
      setInput(document.getElementById('ezrahut'), ezrahutSub.grade);
      filledCount++;
    }

    // Hebrew Expression (עברית הבעה)
    const habaaSub = findSubject(['הבעה', 'לשון']);
    if (habaaSub) {
      setSelect(document.getElementById('yHabaa'), habaaSub.units);
      setInput(document.getElementById('habaa'), habaaSub.grade);
      filledCount++;
    }

    // History (היסטוריה)
    const histSub = findSubject(['היסטוריה']);
    if (histSub) {
      setSelect(document.getElementById('yHistory'), histSub.units);
      setInput(document.getElementById('history'), histSub.grade);
      filledCount++;
    }

    // 3. Fill Electives
    updateStatus('מזין מקצועות בחירה...');
    const mandatoryKeywords = ['אנגלית', 'מתמטיקה', 'ספרות', 'תנך', 'תנ"ך', 'אזרחות', 'הבעה', 'לשון', 'היסטוריה'];
    const electives = subjects.filter((s) => !mandatoryKeywords.some((k) => s.name.includes(k)));

    electives.forEach((elec, idx) => {
      const rowIdx = idx + 1;
      if (rowIdx > 6) return; // Technion table has 6 elective rows

      const row = document.getElementById(`bhira${rowIdx}`);
      if (row) row.style.display = 'table-row';

      const selectElem = document.getElementById(`mikztootBhira_${rowIdx}`);
      const unitsElem = document.getElementById(`y${rowIdx}`);
      const gradeElem = document.getElementById(`G_${rowIdx}`);

      if (selectElem) {
        for (let opt of selectElem.options) {
          if (opt.text.includes(elec.name) || elec.name.includes(opt.text)) {
            selectElem.value = opt.value;
            selectElem.dispatchEvent(new Event('change', { bubbles: true }));
            selectElem.style.backgroundColor = '#EBF4EE';
            break;
          }
        }
      }

      if (unitsElem) setSelect(unitsElem, elec.units);
      if (gradeElem) setInput(gradeElem, elec.grade);
      filledCount++;
    });

    // 4. Fill Psychometric Score
    updateStatus('מזין ציון פסיכומטרי יעד...');
    const psychScore = pendingVerification.psychometricScore || 0;
    if (psychScore > 0) {
      const psychInputs = document.querySelectorAll('input[name="input_3"], #input_76_3, #input_72_3, #input_73_3, #input_74_3');
      psychInputs.forEach((input) => {
        setInput(input, psychScore);
        filledCount++;
      });
    }

    // Optimum Bagrut average field (Gravity Form field 1)
    if (pendingVerification.targetBagrutAverage) {
      const avgInputs = document.querySelectorAll('input[name="input_1"], #input_76_1, #input_72_1, #input_73_1, #input_74_1');
      avgInputs.forEach((input) => setInput(input, pendingVerification.targetBagrutAverage.toFixed(2)));
    }

    // Scroll to the calculator section
    if (bagrotForm) {
      bagrotForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Try to trigger Technion's "חישוב ממוצע" button if it exists
    const calcBtn = document.querySelector('#calc_bagrut, #btnCalc, input[value*="חשב ממוצע"], button[type="submit"]');
    if (calcBtn && typeof calcBtn.click === 'function') {
      try {
        calcBtn.click();
      } catch (e) {
        console.log('[Kalis Extension] Click calc button skipped:', e);
      }
    }

    // 5. Success Message
    updateStatus(`✓ הוזנו בהצלחה ${filledCount} נתוני בגרות ופסיכומטרי (${psychScore})!`, true);

    if (banner) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'סגור';
      closeBtn.style.cssText = `
        background: #3C3C3C;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        margin-right: 10px;
      `;
      closeBtn.onclick = () => banner.remove();
      banner.appendChild(closeBtn);

      setTimeout(() => {
        if (document.body.contains(banner)) banner.remove();
      }, 12000);
    }

    // Clear verification payload so it doesn't re-run on ordinary reloads
    await chrome.storage.local.remove('pendingVerification');

  } catch (err) {
    console.error('[Kalis Extension] Error during Technion autofill:', err);
    updateStatus('אירעה שגיאה חלקית בהזנה: ' + err.message);
  }
})();

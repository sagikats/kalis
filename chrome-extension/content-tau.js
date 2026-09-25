// Kalis Content Script: Tel Aviv University (TAU) Calculator AutoFill
// Target: go.tau.ac.il/*

(async function () {
  console.log('[Kalis Extension] TAU script active. Frame:', window.self === window.top ? 'top' : 'iframe');

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis Extension] Error reading storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) {
    chrome.storage.local.remove('pendingVerification');
    return;
  }

  const isTopWindow = window.self === window.top;

  let banner = null;
  const updateStatus = (text, isSuccess = false) => {
    if (!isTopWindow) return;
    const el = document.getElementById('kalis-banner-tau-status');
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
    banner.id = 'kalis-autofill-banner-tau';
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
        <div style="font-weight: 800; font-size: 13px; color: #111;">סייען מתקבלים — מזין ציונים למחשבון תל אביב...</div>
        <div id="kalis-banner-tau-status" style="font-size: 11px; color: #666; margin-top: 2px;">מאתר את מחשבון ההתאמה בעמוד...</div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Polling helper to wait for the calculator container or inputs to be rendered by React
  const waitForCalculator = async (timeout = 9000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      // Look for the specific React container or inputs
      const calcContainer = document.querySelector('[id*="cr-b918853940b72a520b94ed750266d2af"], .suitability-calc, [data-drupal-selector*="calculator"]');
      const allInputs = document.querySelectorAll('input:not([type="hidden"])');
      if (calcContainer || allInputs.length >= 2) {
        return calcContainer || document;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    return document;
  };

  // Helper for React controlled text/number inputs
  const setReactInput = (input, value) => {
    if (!input) return;
    try {
      input.focus();
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      input.style.backgroundColor = '#EBF4EE';
      input.style.borderColor = '#22C55E';
      input.style.transition = 'background-color 0.5s ease';
    } catch (err) {
      console.error('[Kalis Extension] Error setting React input:', err);
    }
  };

  // Helper for React controlled checkboxes
  const setReactCheckbox = (checkbox, checked) => {
    if (!checkbox || checkbox.checked === checked) return;
    try {
      const nativeCheckboxSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
      if (nativeCheckboxSetter) {
        nativeCheckboxSetter.call(checkbox, checked);
      } else {
        checkbox.checked = checked;
      }
      checkbox.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
      checkbox.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } catch (err) {
      console.error('[Kalis Extension] Error setting React checkbox:', err);
    }
  };

  try {
    updateStatus('מאתר את שדות ממוצע הבגרות והפסיכומטרי...');

    const rootElement = await waitForCalculator(9000);
    const psychScore = pendingVerification.psychometricScore || 0;
    const targetBagrut = Number(pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0);
    const subjects = pendingVerification.subjects || [];

    // TAU Calculator exclusively uses:
    // 1. "ממוצע בגרות" (Maturity average)
    // 2. "ציון פסיכומטרי" (Psychometric score)
    // 3. "יש לי בגרות בפיזיקה ובמתמטיקה ברמת 5 יחידות" (5u Math + Physics Checkbox)
    // 4. "חישוב ציון התאמה" (Calculate button)

    let bagrutInput = null;
    let psychInput = null;
    let mathPhysicsCheckbox = null;
    let calcButton = null;

    // First scan specifically inside the calculator container if found
    const inputs = Array.from(rootElement.querySelectorAll('input'));

    inputs.forEach((inp) => {
      const type = (inp.type || 'text').toLowerCase();
      if (type === 'hidden') return;

      const label = inp.getAttribute('aria-label') || inp.placeholder || inp.name || inp.id || '';
      const parentText = inp.parentElement?.textContent || '';
      const containerText = inp.closest('.form-group, div, label')?.textContent || '';
      const combined = (label + ' ' + parentText + ' ' + containerText).toLowerCase();

      // Ignore search bar ("מה מעניין אותך?", search, filters)
      if (combined.includes('מה מעניין') || combined.includes('חיפוש תוכנית') || combined.includes('search') || combined.includes('אימייל') || combined.includes('טלפון')) {
        return;
      }

      // Checkbox: Math 5u + Physics 5u
      if (type === 'checkbox') {
        if (combined.includes('פיזיקה') || combined.includes('מתמטיקה') || combined.includes('5 יחידות') || combined.includes('math')) {
          mathPhysicsCheckbox = inp;
        }
        return;
      }

      // Psychometric Input
      if (combined.includes('פסיכומטרי') || combined.includes('רב תחומי') || combined.includes('psycho')) {
        psychInput = inp;
        return;
      }

      // Bagrut Average Input
      if (combined.includes('ממוצע בגרות') || combined.includes('בגרות מיטבי') || combined.includes('בגרות') || combined.includes('maturity')) {
        bagrutInput = inp;
        return;
      }
    });

    // Fallback: If not matched by label, match by input attributes or position within calculator
    if (!bagrutInput || !psychInput) {
      const candidateNumericInputs = inputs.filter((inp) => {
        const type = (inp.type || 'text').toLowerCase();
        if (type === 'checkbox' || type === 'hidden' || type === 'submit') return false;
        const txt = (inp.placeholder || inp.name || inp.id || inp.parentElement?.textContent || '').toLowerCase();
        if (txt.includes('search') || txt.includes('חיפוש') || txt.includes('מה מעניין') || txt.includes('אימייל')) return false;
        return true;
      });

      candidateNumericInputs.forEach((inp) => {
        const max = Number(inp.getAttribute('max') || 0);
        const min = Number(inp.getAttribute('min') || 0);

        if (!psychInput && (max >= 200 || min >= 200)) {
          psychInput = inp;
        } else if (!bagrutInput && ((max > 0 && max <= 150) || (min > 0 && min <= 100))) {
          bagrutInput = inp;
        }
      });

      // Positional fallback: First numeric is Bagrut, second is Psychometric
      if (!bagrutInput && candidateNumericInputs[0]) bagrutInput = candidateNumericInputs[0];
      if (!psychInput && candidateNumericInputs[1]) psychInput = candidateNumericInputs[1];
    }

    let filledCount = 0;

    // 1. Fill Bagrut Average
    if (bagrutInput && targetBagrut > 0) {
      setReactInput(bagrutInput, targetBagrut.toFixed(1));
      filledCount++;
    }

    // 2. Fill Psychometric Score
    if (psychInput && psychScore > 0) {
      setReactInput(psychInput, psychScore);
      filledCount++;
    }

    // 3. Set Math 5u + Physics 5u Checkbox (Realit bonus)
    const hasMath5 = subjects.some((s) => (s?.name || s?.subjectName || '').includes('מתמטיקה') && Number(s.units) >= 5 && Number(s.grade) >= 55);
    const hasPhysics5 = subjects.some((s) => (s?.name || s?.subjectName || '').includes('פיזיקה') && Number(s.units) >= 5 && Number(s.grade) >= 55);
    if (mathPhysicsCheckbox && hasMath5 && hasPhysics5) {
      setReactCheckbox(mathPhysicsCheckbox, true);
      filledCount++;
    }

    // Scroll to the calculator
    if (bagrutInput) {
      bagrutInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 4. Trigger Calculate Button
    const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn'));
    calcButton = allButtons.find((b) => {
      const text = (b.textContent || b.value || '').trim();
      return text === 'חישוב ציון התאמה' || text === 'חישוב' || text.includes('חישוב ציון');
    });

    if (calcButton && typeof calcButton.click === 'function') {
      try {
        await new Promise((r) => setTimeout(r, 400));
        calcButton.click();
      } catch (e) {
        console.log('[Kalis Extension] Click TAU calc skipped:', e);
      }
    }

    // 5. Update Status Banner
    const bagrutFormatted = targetBagrut > 0 ? targetBagrut.toFixed(1) : '-';
    updateStatus(`✓ הוזנו בהצלחה: ממוצע בגרות ${bagrutFormatted} וציון פסיכומטרי ${psychScore}!`, true);

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
        cursor: pointer;
        margin-right: 10px;
        font-weight: bold;
      `;
      closeBtn.onclick = () => banner.remove();
      banner.appendChild(closeBtn);

      setTimeout(() => {
        if (document.body.contains(banner)) banner.remove();
      }, 12000);
    }

    await chrome.storage.local.remove('pendingVerification');
  } catch (err) {
    console.error('[Kalis Extension] Error during TAU autofill:', err);
    updateStatus('שגיאה בהזנה: ' + err.message);
  }
})();

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
        <div id="kalis-banner-tau-status" style="font-size: 11px; color: #666; margin-top: 2px;">מאתר שדות במחשבון...</div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Polling helper
  const waitForInputs = async (timeout = 8000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 2) return Array.from(inputs);
      await new Promise((r) => setTimeout(r, 250));
    }
    return Array.from(document.querySelectorAll('input'));
  };

  // Helper for React controlled inputs
  const setReactInput = (input, value) => {
    if (!input) return;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    input.style.backgroundColor = '#EBF4EE';
    input.style.borderColor = '#22C55E';
    input.style.transition = 'background-color 0.5s ease';
  };

  try {
    updateStatus('מאתר שדות בטופס של אוניברסיטת תל אביב...');

    const inputs = await waitForInputs(8000);
    const psychScore = pendingVerification.psychometricScore || 0;
    const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
    const subjects = pendingVerification.subjects || [];

    let filledCount = 0;
    let firstFilledInput = null;

    inputs.forEach((inp) => {
      const label = inp.getAttribute('aria-label') || inp.placeholder || inp.name || inp.id || '';
      const parentText = inp.parentElement?.textContent || '';
      const combined = (label + ' ' + parentText).toLowerCase();

      // Psychometric field
      if (psychScore > 0 && (combined.includes('פסיכומטרי') || combined.includes('רב תחומי') || combined.includes('כללי') || combined.includes('psychometric'))) {
        setReactInput(inp, psychScore);
        filledCount++;
        if (!firstFilledInput) firstFilledInput = inp;
      }

      // Bagrut average field
      if (targetBagrut > 0 && (combined.includes('ממוצע בגרות') || combined.includes('בגרות מיטבי') || combined.includes('ממוצע') || combined.includes('bagrut'))) {
        setReactInput(inp, targetBagrut.toFixed(1));
        filledCount++;
        if (!firstFilledInput) firstFilledInput = inp;
      }

      // Subject specific inputs (if on detailed Bagrut breakdown page)
      subjects.forEach((sub) => {
        if (combined.includes(sub.name.toLowerCase())) {
          setReactInput(inp, sub.grade);
          filledCount++;
          if (!firstFilledInput) firstFilledInput = inp;
        }
      });
    });

    if (firstFilledInput) {
      firstFilledInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Try to trigger any calculate buttons on TAU
    const calcBtn = document.querySelector('button[type="submit"], input[type="submit"], button:has-text("חשב")');
    if (calcBtn && typeof calcBtn.click === 'function') {
      try {
        calcBtn.click();
      } catch (e) {
        console.log('[Kalis Extension] Click TAU calc skipped:', e);
      }
    }

    updateStatus(`✓ הוזנו נתוני יעד: פסיכומטרי ${psychScore}, ממוצע בגרות ${targetBagrut.toFixed(1)}!`, true);

    if (banner) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'סגור';
      closeBtn.style.cssText = 'background: #3C3C3C; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer; margin-right: 10px; font-weight: bold;';
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

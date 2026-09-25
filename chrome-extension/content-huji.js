// Kalis Content Script: Hebrew University of Jerusalem (HUJI) AutoFill
// Target: go.huji.ac.il/* and *.huji.ac.il/*

(async function () {
  console.log('[Kalis HUJI] Script initialized on:', window.location.href, 'Frame:', window.self === window.top ? 'top' : 'iframe');

  // 1. Fetch pending verification data
  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis HUJI] Storage error:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  const isTopWindow = window.self === window.top;
  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const psychScore = pendingVerification.psychometricScore || 0;
  const psychQuant = pendingVerification.psychQuant;
  const psychVerbal = pendingVerification.psychVerbal;
  const psychEnglish = pendingVerification.psychEnglish;
  const subjects = pendingVerification.subjects || [];

  // 2. Banner Notification (Top window)
  const showBanner = (title, subtitle, isSuccess = false) => {
    if (!isTopWindow) return;
    let b = document.getElementById('kalis-autofill-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'kalis-autofill-banner';
      b.style.cssText = `
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999999;
        background: #FAF8F5;
        border: 2px solid #3C3C3C;
        border-radius: 16px;
        padding: 12px 22px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", sans-serif;
        direction: rtl;
        text-align: right;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #222222;
        font-size: 13px;
        max-width: 90vw;
      `;
      document.body.appendChild(b);
    }
    b.innerHTML = `
      <div style="width: 32px; height: 32px; background: #3C3C3C; border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; flex-shrink: 0;">
        ${isSuccess ? '✓' : '🎓'}
      </div>
      <div>
        <div style="font-weight: 800; color: #111;">${title}</div>
        <div style="font-size: 11.5px; color: ${isSuccess ? '#15803d' : '#66635C'}; margin-top: 1px; font-weight: ${isSuccess ? '700' : '500'};">
          ${subtitle}
        </div>
      </div>
    `;
    if (isSuccess) {
      setTimeout(() => {
        if (b && b.parentNode) {
          b.style.opacity = '0';
          b.style.transition = 'opacity 0.6s ease';
          setTimeout(() => b.remove(), 600);
        }
      }, 7000);
    }
  };

  showBanner('מתקבלים // האוניברסיטה העברית', 'מזין נתוני בגרות ופסיכומטרי אוטומטית...', false);

  // 3. React/Native input setter
  const setInputValue = (inp, val) => {
    if (!inp || val === undefined || val === null) return false;
    try {
      inp.focus();
      const proto = window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(inp, val);
      } else {
        inp.value = val;
      }
      inp.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      inp.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      inp.style.backgroundColor = '#EBF4EE';
      inp.style.borderColor = '#22C55E';
      return true;
    } catch (e) {
      console.warn('[Kalis HUJI] Error setting input value:', e);
      return false;
    }
  };

  const getContext = (inp) => {
    const parent = inp.closest('.form-group, .field, tr, div, label') || inp.parentElement;
    const labelFor = inp.id ? document.querySelector(`label[for="${inp.id}"]`) : null;
    return (
      (inp.name || '') + ' ' +
      (inp.id || '') + ' ' +
      (inp.placeholder || '') + ' ' +
      (inp.getAttribute('aria-label') || '') + ' ' +
      (labelFor ? labelFor.textContent : '') + ' ' +
      (parent ? parent.textContent : '')
    ).toLowerCase();
  };

  // 4. Polling fill engine (up to 5 seconds)
  let attempts = 0;
  const maxAttempts = 25;
  let hasFilled = false;

  const tryFillHuji = () => {
    if (hasFilled) return;
    attempts++;

    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])'));
    if (allInputs.length === 0) {
      if (attempts < maxAttempts) setTimeout(tryFillHuji, 200);
      return;
    }

    let bagrutInp = null;
    let psychInp = null;
    let filledCount = 0;

    allInputs.forEach((inp) => {
      const txt = getContext(inp);
      if (txt.includes('search') || txt.includes('חיפוש') || txt.includes('סיסמה') || txt.includes('email') || txt.includes('טלפון')) return;

      // Bagrut average
      if (!bagrutInp && targetBagrut > 0) {
        if (
          txt.includes('ממוצע') ||
          txt.includes('בגרות') ||
          txt.includes('bagrut') ||
          txt.includes('average') ||
          (inp.getAttribute('max') && Number(inp.getAttribute('max')) <= 140 && Number(inp.getAttribute('max')) >= 100)
        ) {
          bagrutInp = inp;
          if (setInputValue(inp, targetBagrut.toFixed(1))) filledCount++;
          return;
        }
      }

      // Psychometric score
      if (!psychInp && psychScore > 0) {
        if (
          txt.includes('פסיכומטרי') ||
          txt.includes('psychometric') ||
          txt.includes('סכם') ||
          txt.includes('ציון פסיכומטרי') ||
          (inp.getAttribute('max') && Number(inp.getAttribute('max')) >= 700)
        ) {
          psychInp = inp;
          if (setInputValue(inp, psychScore)) filledCount++;
          return;
        }
      }

      // Quantitative / Verbal / English
      if (txt.includes('כמותי') && psychQuant) {
        if (setInputValue(inp, psychQuant)) filledCount++;
      } else if (txt.includes('מילולי') && psychVerbal) {
        if (setInputValue(inp, psychVerbal)) filledCount++;
      } else if (txt.includes('אנגלית') && psychEnglish) {
        if (setInputValue(inp, psychEnglish)) filledCount++;
      }
    });

    if (filledCount > 0 || (bagrutInp && psychInp)) {
      hasFilled = true;
      console.log('[Kalis HUJI] Auto-filled successfully:', filledCount, 'fields.');

      showBanner(
        '✓ הוזנו נתונים בהצלחה!',
        `ממוצע בגרות ${targetBagrut.toFixed(1)} • פסיכומטרי ${psychScore} • בודק קבלה...`,
        true
      );

      // Trigger Calculate / Check Button
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, a.button, .btn, .button'));
        const calcBtn = buttons.find((b) => {
          const t = (b.textContent || b.value || '').trim();
          return (
            t.includes('בדוק') ||
            t.includes('חישוב') ||
            t.includes('חשב') ||
            t.includes('סיכויי קבלה') ||
            t.includes('המשך') ||
            t.includes('התאמה') ||
            t.includes('Submit') ||
            t.includes('Calculate')
          );
        });

        if (calcBtn && typeof calcBtn.click === 'function') {
          console.log('[Kalis HUJI] Clicking check button:', calcBtn);
          calcBtn.click();
        }
      }, 400);

      return;
    }

    if (attempts < maxAttempts) {
      setTimeout(tryFillHuji, 250);
    }
  };

  // Launch
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryFillHuji);
  } else {
    tryFillHuji();
  }

  // 5. Floating Companion Card
  if (isTopWindow && !document.getElementById('kalis-floating-companion')) {
    const widget = document.createElement('div');
    widget.id = 'kalis-floating-companion';
    widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 999999;
      background: #FAF8F5;
      border: 2px solid #3C3C3C;
      border-radius: 18px;
      padding: 14px 16px;
      box-shadow: 0 12px 35px rgba(0,0,0,0.25);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", sans-serif;
      direction: rtl;
      text-align: right;
      width: 310px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      color: #222222;
    `;

    const targetSekem = pendingVerification.targetSekem ? pendingVerification.targetSekem.toFixed(1) : '-';
    const subjectsHtml = subjects.map((s) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; background: white; border: 1px solid #E5DFD4; border-radius: 8px; font-size: 11px; margin-bottom: 4px;">
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
          <strong>${s.name}</strong> <span style="color: #666;">(${s.units} יח״ל)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 900; color: #222;">${s.grade}</span>
          <button class="kalis-copy-btn" data-val="${s.grade}" style="background: #FAF8F5; border: 1px solid #DDD7CC; border-radius: 6px; padding: 2px 6px; font-size: 10px; cursor: pointer; color: #3C3C3C;">העתק</button>
        </div>
      </div>
    `).join('');

    widget.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5DFD4; padding-bottom: 6px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 16px;">🎓</span>
          <strong style="font-size: 12.5px; color: #111;">סייען מתקבלים — האוניברסיטה העברית</strong>
        </div>
        <button id="kalis-close-widget" style="background: none; border: none; font-size: 15px; cursor: pointer; color: #888; padding: 0 4px;">✕</button>
      </div>

      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">סכם צפוי</div>
          <div style="font-size: 14px; font-weight: 900; color: #15803d;">${targetSekem}</div>
        </div>
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">פסיכומטרי</div>
          <div style="font-size: 14px; font-weight: 900; color: #222;">${psychScore || 'ללא'}</div>
        </div>
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">ממוצע בגרות</div>
          <div style="font-size: 14px; font-weight: 900; color: #222;">${targetBagrut ? targetBagrut.toFixed(1) : '-'}</div>
        </div>
      </div>

      <div style="flex: 1; overflow-y: auto; max-height: 150px; padding-right: 2px;">
        ${subjectsHtml}
      </div>
    `;

    document.body.appendChild(widget);

    document.getElementById('kalis-close-widget')?.addEventListener('click', () => widget.remove());

    widget.querySelectorAll('.kalis-copy-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget;
        const val = target.getAttribute('data-val');
        if (val) {
          await navigator.clipboard.writeText(val);
          const originalText = target.textContent;
          target.textContent = '✓ הועתק';
          target.style.color = '#15803d';
          setTimeout(() => {
            target.textContent = originalText;
            target.style.color = '#3C3C3C';
          }, 1500);
        }
      });
    });
  }
})();

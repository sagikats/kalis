// Kalis Content Script: Universal Full-AutoFill for Israeli University Calculators
// Target: Ben-Gurion (BGU), Hebrew University (HUJI), Bar-Ilan (BIU), Haifa, Ariel, Reichman (RUNI)

(async function () {
  console.log('[Kalis Extension] Universal University AutoFill active on:', window.location.href, 'Frame:', window.self === window.top ? 'top' : 'iframe');

  // 1. Fetch pending verification data from extension storage
  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis Extension] Error accessing storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  // 2. Expiry verification (active for 15 minutes)
  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  const isTopWindow = window.self === window.top;
  const psychScore = pendingVerification.psychometricScore || 0;
  const targetSekem = pendingVerification.targetSekem ? pendingVerification.targetSekem.toFixed(2) : '-';
  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const subjects = pendingVerification.subjects || [];
  const instName = pendingVerification.institutionName || 'האוניברסיטה';

  // 3. Floating Banner UI (Top window only)
  let banner = null;
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
        transition: all 0.3s ease;
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
        if (b && b.parentNode) b.style.opacity = '0';
        setTimeout(() => { if (b && b.parentNode) b.remove(); }, 600);
      }, 7000);
    }
  };

  showBanner(`מתקבלים // ${instName}`, 'מזין נתוני בגרות ופסיכומטרי אוטומטית...', false);

  // 4. Reactive State Setters (React, Vue, Angular, Native)
  const setNativeValue = (element, val) => {
    if (!element || val === undefined || val === null) return false;
    try {
      element.focus();
      const proto = element instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, val);
      } else {
        element.value = val;
      }
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      element.style.backgroundColor = '#EBF4EE';
      element.style.borderColor = '#22C55E';
      return true;
    } catch (e) {
      console.warn('[Kalis Extension] Error setting value:', e);
      return false;
    }
  };

  const setSelectOption = (selectEl, valOrText) => {
    if (!selectEl) return false;
    const target = String(valOrText).trim().toLowerCase();
    for (let i = 0; i < selectEl.options.length; i++) {
      const opt = selectEl.options[i];
      if (opt.value.toLowerCase() === target || opt.text.toLowerCase().includes(target)) {
        selectEl.selectedIndex = i;
        selectEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        selectEl.style.backgroundColor = '#EBF4EE';
        return true;
      }
    }
    return false;
  };

  const setCheckbox = (chk, state = true) => {
    if (!chk) return false;
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked');
    if (descriptor && descriptor.set) {
      descriptor.set.call(chk, state);
    } else {
      chk.checked = state;
    }
    chk.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    chk.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    return true;
  };

  // Helper to extract comprehensive context surrounding any input field
  const getFieldContext = (inp) => {
    const parent = inp.closest('.form-group, .field, .input-container, tr, div, label') || inp.parentElement;
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

  // 5. Automated Field Fill Engine
  let hasFilled = false;
  let attempts = 0;
  const maxAttempts = 25; // 25 * 200ms = 5.0 seconds polling for SPAs

  const attemptAutoFill = () => {
    attempts++;
    let filledCount = 0;
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select'));

    if (inputs.length === 0) {
      if (attempts < maxAttempts) setTimeout(attemptAutoFill, 200);
      return;
    }

    // Identify candidate subject maps
    const mathSub = subjects.find(s => s.name.includes('מתמטיקה'));
    const engSub = subjects.find(s => s.name.includes('אנגלית'));
    const phySub = subjects.find(s => s.name.includes('פיזיקה'));

    let bagrutInput = null;
    let psychInput = null;

    inputs.forEach((inp) => {
      const txt = getFieldContext(inp);
      if (txt.includes('search') || txt.includes('חיפוש') || txt.includes('סיסמה') || txt.includes('דוא"ל') || txt.includes('phone') || txt.includes('טלפון')) return;

      const isSelect = inp instanceof HTMLSelectElement;
      const isNum = inp.type === 'number' || inp.type === 'text';

      // A. Psychometric General Score (200 - 800)
      if (isNum && !psychInput && psychScore > 0) {
        if (
          txt.includes('פסיכומטרי') ||
          txt.includes('psychometric') ||
          txt.includes('psycho') ||
          txt.includes('סכם כללי') ||
          txt.includes('ציון כללי') ||
          (inp.getAttribute('max') && Number(inp.getAttribute('max')) >= 800)
        ) {
          psychInput = inp;
          if (setNativeValue(inp, psychScore)) filledCount++;
          return;
        }
      }

      // B. Bagrut Average (40 - 135)
      if (isNum && !bagrutInput && targetBagrut > 0) {
        if (
          txt.includes('ממוצע') ||
          txt.includes('בגרות') ||
          txt.includes('bagrut') ||
          txt.includes('maturity') ||
          txt.includes('average') ||
          txt.includes('avg') ||
          inp.id?.includes('bagrut') ||
          inp.name?.includes('bagrut') ||
          inp.id?.includes('average') ||
          (inp.getAttribute('max') && Number(inp.getAttribute('max')) <= 150 && Number(inp.getAttribute('max')) >= 100)
        ) {
          bagrutInput = inp;
          const formattedVal = targetBagrut.toFixed(1);
          if (setNativeValue(inp, formattedVal)) filledCount++;
          return;
        }
      }

      // C. Math Units & Grade
      if (mathSub && txt.includes('מתמטיקה')) {
        if (isSelect || txt.includes('יחידות') || txt.includes('units') || txt.includes('יח״ל')) {
          if (setSelectOption(inp, mathSub.units)) filledCount++;
        } else if (isNum) {
          if (setNativeValue(inp, mathSub.grade)) filledCount++;
        }
        return;
      }

      // D. English Units & Grade
      if (engSub && txt.includes('אנגלית')) {
        if (isSelect || txt.includes('יחידות') || txt.includes('units') || txt.includes('יח״ל')) {
          if (setSelectOption(inp, engSub.units)) filledCount++;
        } else if (isNum) {
          if (setNativeValue(inp, engSub.grade)) filledCount++;
        }
        return;
      }

      // E. Physics Units & Grade
      if (phySub && txt.includes('פיזיקה')) {
        if (isSelect || txt.includes('יחידות') || txt.includes('units')) {
          if (setSelectOption(inp, phySub.units)) filledCount++;
        } else if (isNum) {
          if (setNativeValue(inp, phySub.grade)) filledCount++;
        }
        return;
      }

      // F. Realit Bonus Checkbox (Math 5u + Physics 5u)
      if (inp.type === 'checkbox' && (txt.includes('מתמטיקה') || txt.includes('פיזיקה') || txt.includes('5 יחידות') || txt.includes('מוגבר'))) {
        const has5m = mathSub && mathSub.units >= 5 && mathSub.grade >= 55;
        const has5p = phySub && phySub.units >= 5 && phySub.grade >= 55;
        if (has5m && has5p) {
          if (setCheckbox(inp, true)) filledCount++;
        }
        return;
      }

      // G. Detailed subject grades matching
      subjects.forEach((s) => {
        if (txt.includes(s.name.toLowerCase())) {
          if (isNum && !inp.value) {
            if (setNativeValue(inp, s.grade)) filledCount++;
          }
        }
      });
    });

    // If we filled key fields or found inputs
    if (filledCount > 0 || bagrutInput || psychInput) {
      hasFilled = true;
      if (bagrutInput) bagrutInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

      showBanner(
        `✓ הוזנו ${filledCount} נתונים בהצלחה!`,
        `ממוצע בגרות ${targetBagrut.toFixed(1)} • פסיכומטרי ${psychScore} • מחשב סכם...`,
        true
      );

      // Trigger Calculate Button automatically
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, a.button, .btn, .button'));
        const calcBtn = buttons.find((b) => {
          const btnTxt = (b.textContent || b.value || '').trim();
          return (
            btnTxt.includes('חישוב') ||
            btnTxt.includes('חשב') ||
            btnTxt.includes('בדוק') ||
            btnTxt.includes('סיכויי קבלה') ||
            btnTxt.includes('המשך') ||
            btnTxt.includes('Calculate') ||
            btnTxt.includes('Submit')
          );
        });

        if (calcBtn && typeof calcBtn.click === 'function') {
          console.log('[Kalis Extension] Triggering university calculation button:', calcBtn);
          calcBtn.click();
        }
      }, 400);

      return;
    }

    if (attempts < maxAttempts) {
      setTimeout(attemptAutoFill, 250);
    } else {
      showBanner(`מתקבלים // ${instName}`, 'מוכן להזנה. השתמש בסייען בפינה.', false);
    }
  };

  // Launch auto-fill engine
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptAutoFill);
  } else {
    attemptAutoFill();
  }

  // 6. Floating Companion Card (Accessible for Reference & Manual Review)
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
      transition: all 0.3s ease;
    `;

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
          <strong style="font-size: 12.5px; color: #111;">סייען מתקבלים — ${instName}</strong>
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

      <button id="kalis-retrigger-btn" style="width: 100%; padding: 8px; background: #3C3C3C; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; transition: background 0.2s; margin-bottom: 8px;">
        ⚡ הזן ציונים שוב
      </button>

      <div style="flex: 1; overflow-y: auto; max-height: 150px; padding-right: 2px;">
        ${subjectsHtml}
      </div>
    `;

    document.body.appendChild(widget);

    document.getElementById('kalis-close-widget')?.addEventListener('click', () => {
      widget.remove();
    });

    document.getElementById('kalis-retrigger-btn')?.addEventListener('click', () => {
      attempts = 0;
      attemptAutoFill();
    });

    // Wire individual copy buttons
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

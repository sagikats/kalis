// Kalis Dedicated Content Script: Tel Aviv University (TAU)
// Target: go.tau.ac.il/he/calculator and *.tau.ac.il/*
// Automates: Maturity (Bagrut average), Psychometric General (psycho), Realit Bonus checkbox, and Calculation

(function () {
  'use strict';
  console.log('[Kalis TAU] Dedicated script loaded on:', window.location.href);

  /**
   * Helper: Bulletproof React 16-19 controlled input setter
   */
  function setTauReactInput(input, val) {
    if (!input || val === undefined || val === null) return false;
    try {
      try { input.focus(); } catch (e) {}

      const strVal = String(val);
      let setDone = false;
      try {
        const proto = Object.getPrototypeOf(input) || window.HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value') || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (desc && desc.set) {
          desc.set.call(input, strVal);
          setDone = true;
        }
      } catch (e) {}

      if (!setDone) {
        try { input.value = strVal; } catch (e) {}
      }

      // Reset React 16+ _valueTracker so React recognizes programmatic change
      try {
        if (input._valueTracker && typeof input._valueTracker.setValue === 'function') {
          input._valueTracker.setValue('');
        }
      } catch (e) {}

      // Dispatch native input & change events with bubbles: true
      try { input.dispatchEvent(new Event('input', { bubbles: true, composed: true })); } catch (e) {}
      try {
        input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: strVal }));
      } catch (e) {}
      try { input.dispatchEvent(new Event('change', { bubbles: true, composed: true })); } catch (e) {}

      // Direct React internal props invocation
      try {
        const rKey = Object.keys(input).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
        if (rKey && input[rKey]) {
          const fakeEvt = {
            target: input,
            currentTarget: input,
            bubbles: true,
            defaultPrevented: false,
            persist: () => {},
            preventDefault: () => {},
            stopPropagation: () => {}
          };
          if (typeof input[rKey].onChange === 'function') {
            input[rKey].onChange(fakeEvt);
          }
          if (typeof input[rKey].onInput === 'function') {
            input[rKey].onInput(fakeEvt);
          }
        }
      } catch (e) {}

      try { input.dispatchEvent(new Event('blur', { bubbles: true, composed: true })); } catch (e) {}
      try {
        input.style.backgroundColor = '#EBF4EE';
        input.style.borderColor = '#22C55E';
        input.style.transition = 'background-color 0.4s ease, border-color 0.4s ease';
      } catch (e) {}
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Helper: Controlled Checkbox Setter
   */
  function setTauCheckbox(cb, isChecked) {
    if (!cb) return false;
    try {
      try { cb.focus(); } catch (e) {}
      const boolVal = Boolean(isChecked);
      let setDone = false;

      try {
        const proto = Object.getPrototypeOf(cb) || window.HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'checked') || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked');
        if (desc && desc.set) {
          desc.set.call(cb, boolVal);
          setDone = true;
        }
      } catch (e) {}

      if (!setDone) {
        try { cb.checked = boolVal; } catch (e) {}
      }

      try {
        if (cb._valueTracker && typeof cb._valueTracker.setValue === 'function') {
          cb._valueTracker.setValue(!boolVal);
        }
      } catch (e) {}

      try { cb.dispatchEvent(new Event('click', { bubbles: true, composed: true })); } catch (e) {}
      try { cb.dispatchEvent(new Event('change', { bubbles: true, composed: true })); } catch (e) {}

      try {
        const rKey = Object.keys(cb).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
        if (rKey && cb[rKey] && typeof cb[rKey].onChange === 'function') {
          cb[rKey].onChange({ target: cb, currentTarget: cb, bubbles: true });
        }
      } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Dedicated TAU Autofill Engine
   */
  async function fillTauForm(candidateData) {
    if (!candidateData) return { handled: false };

    console.log('[Kalis TAU] Executing autofill for:', candidateData.programName || 'TAU Track');

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    // 1. Bagrut Average Field (TAU React uses name="maturity" and id="formmaturityScore")
    const maturityInput = document.querySelector('input[name="maturity"], input#formmaturityScore, input#formMaturity, [aria-label*="בגרות"]');
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);

    if (maturityInput && targetBagrut > 0) {
      const formattedAvg = targetBagrut.toFixed(1);
      setTauReactInput(maturityInput, formattedAvg);
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'ממוצע בגרות',
        value: formattedAvg,
        reason: `הוזן ממוצע בגרות: ${formattedAvg}`
      });
    } else if (maturityInput) {
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'ממוצע בגרות',
        value: null,
        reason: 'לא הוזן ממוצע בגרות'
      });
    }

    // 2. Psychometric General Field (TAU React uses name="psycho" and id="formpsychoScore")
    const psychInput = document.querySelector('input[name="psycho"], input#formpsychoScore, input[name="psychometric"], input#formPsychometric, [aria-label*="פסיכומטרי"]');
    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    if (psychInput && hasPsych) {
      setTauReactInput(psychInput, String(psychScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי כללי (רב-תחומי)',
        value: String(psychScore),
        reason: `הוזן ציון רב-תחומי: ${psychScore}`
      });
    } else if (psychInput) {
      setTauReactInput(psychInput, '');
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'פסיכומטרי כללי',
        value: null,
        reason: 'ללא פסיכומטרי'
      });
    }

    // 3. Realit Bonus Checkbox (5u Math + 5u Physics)
    const realitCheckbox = document.querySelector('input#haveMathPhysics, input[type="checkbox"][id*="MathPhysics"], input[type="checkbox"][name*="real"], input[type="checkbox"][name*="check"]');
    if (realitCheckbox) {
      const subjects = candidateData.subjects || [];
      const mathSub = subjects.find((s) => s.name && s.name.includes('מתמטיקה'));
      const phySub = subjects.find((s) => s.name && s.name.includes('פיזיקה'));
      const isEligible = Boolean(
        mathSub && Number(mathSub.units) === 5 && Number(mathSub.grade) >= 55 &&
        phySub && Number(phySub.units) === 5 && Number(phySub.grade) >= 55
      );

      setTauCheckbox(realitCheckbox, isEligible);
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'בונוס ריאלי (5 יח״ל פיזיקה ומתמטיקה)',
        value: isEligible ? 'מסומן ✓' : 'לא מסומן',
        reason: isEligible ? 'זכאי לבונוס ריאלי' : 'אינו עומד בתנאי הבונוס'
      });
    }

    // 4. Trigger TAU Calculate Button (has class .calc and text חישוב)
    setTimeout(() => {
      const calcBtn = document.querySelector('button.calc, button[variant="dark"].calc, button.btn-dark.calc, button.save-btn, button[variant="primary"], button.btn-primary, [role="button"][class*="save"]');
      if (calcBtn) {
        console.log('[Kalis TAU] Clicking calculate button...');
        calcBtn.click();
      }
    }, 400);

    return {
      handled: true,
      auditLog,
      filledCount,
      skippedCount
    };
  }

  // Hook into KalisDock
  const registerHandler = () => {
    // Scroll smoothly to calculator container
    const calcContainer = document.querySelector(
      '[id*="cr-b918853940b72a520b94ed750266d2af"], .suitability-calc, [data-drupal-selector*="calculator"]'
    );
    if (calcContainer) {
      calcContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (window.KalisDock) {
      window.KalisDock.customFillHandler = async (candidateData) => {
        return fillTauForm(candidateData);
      };

      // Listen for data update events when user switches tracks in web app
      window.addEventListener('kalis:data-updated', (e) => {
        if (e.detail) {
          console.log('[Kalis TAU] Re-filling form with updated track data...');
          fillTauForm(e.detail);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHandler);
  } else {
    registerHandler();
  }

  // Watch for TAU calculation results
  const observeResults = () => {
    const observer = new MutationObserver(() => {
      const adapterEl = document.querySelector('.adapter-score, p.adapter-score');
      if (adapterEl) {
        const text = (adapterEl.textContent || '').trim();
        const scoreMatch = text.match(/(\d{3}(?:\.\d{1,2})?)/);
        if (scoreMatch) {
          console.log('[Kalis TAU] Captured calculated adapter score:', scoreMatch[1]);
          window.postMessage({
            type: 'KALIS_INSTITUTION_CALCULATED_RESULTS',
            sekemQuantity: scoreMatch[1]
          }, '*');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  setTimeout(observeResults, 1200);

  console.log('[Kalis TAU] Dedicated engine initialized.');
})();

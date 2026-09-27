// Kalis Dedicated Content Script: Hebrew University of Jerusalem (HUJI)
// Target: go.huji.ac.il/* and *.huji.ac.il/*
// Automates: Opening admission calculator modal + live input of Bagrut average & Psychometric scores (all 3 emphases)
// Supports both general admission calculator and individual course modal (/programAdmission_*)

(function () {
  'use strict';
  console.log('[Kalis HUJI] Dedicated script loaded on:', window.location.href);

  /**
   * Inject state directly into HUJI's Vuex store from the Main World
   */
  function injectHujiMainWorldSync(bagrut, petMulti, petQuant, petVerbal) {
    const script = document.createElement('script');
    script.textContent = `(${function (b, m, q, v) {
      try {
        const appEl = document.querySelector('#app') || document.querySelector('[data-v-app]') || document.body;
        const store = appEl?.__vue__?.$store;
        if (store) {
          if (b !== null && b !== undefined && b !== '') {
            store.commit('setGradeByKey', { key: 'bagrut', value: String(b) });
          }
          if (m !== null && m !== undefined && m !== '') {
            store.commit('setGradePetByKey', { key: 'multi', value: String(m) });
          }
          if (q !== null && q !== undefined && q !== '') {
            store.commit('setGradePetByKey', { key: 'quantity', value: String(q) });
          }
          if (v !== null && v !== undefined && v !== '') {
            store.commit('setGradePetByKey', { key: 'verbal', value: String(v) });
          }
          if (store.state && store.state.graphGrades) {
            if (b) store.state.graphGrades.bagrut = String(b);
            if (m) store.state.graphGrades.pet.multi = String(m);
            if (q) store.state.graphGrades.pet.quantity = String(q);
            if (v) store.state.graphGrades.pet.verbal = String(v);
          }
          console.log('[Kalis HUJI MainWorld] Successfully committed grades to Vuex store:', { b, m, q, v });
        }
      } catch (err) {
        console.warn('[Kalis HUJI MainWorld] Vuex store commit warning:', err);
      }
    }})(${JSON.stringify(bagrut)}, ${JSON.stringify(petMulti)}, ${JSON.stringify(petQuant)}, ${JSON.stringify(petVerbal)});`;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  /**
   * Helper: Find HUJI input fields across general calculator and program modal
   */
  function findHujiInputs() {
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'));

    function getContext(el) {
      const parts = [];
      if (el.id) parts.push(el.id);
      if (el.name) parts.push(el.name);
      if (el.placeholder) parts.push(el.placeholder);
      if (el.className) parts.push(el.className);

      const lbl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
      if (lbl) parts.push(lbl.textContent || '');

      const parent = el.closest('.form-group, .field, .input-row, tr, td, div');
      if (parent) parts.push(parent.textContent || '');

      if (el.previousElementSibling) parts.push(el.previousElementSibling.textContent || '');
      if (el.nextElementSibling) parts.push(el.nextElementSibling.textContent || '');

      return parts.join(' ').toLowerCase().replace(/\s+/g, ' ');
    }

    let bagrutEl = document.getElementById('bagrut') || document.querySelector('input[name="bagrut"]');
    let petAllEl = document.getElementById('petAll') || document.querySelector('input[name="petAll"]');
    let petMathEl = document.getElementById('petMath') || document.querySelector('input[name="petMath"]');
    let petVerbalEl = document.getElementById('petVerbal') || document.querySelector('input[name="petVerbal"]');

    for (const input of allInputs) {
      const ctx = getContext(input);

      // Strictly ignore previous degree and mechina inputs
      if (
        ctx.includes('תואר קודם') ||
        ctx.includes('תואר ראשון קודם') ||
        ctx.includes('לימודים קודמים') ||
        ctx.includes('מכינה') ||
        ctx.includes('mechina') ||
        ctx.includes('prior degree') ||
        ctx.includes('previous degree')
      ) {
        continue;
      }

      if (!bagrutEl && (ctx.includes('בגרות מותאם') || (ctx.includes('בגרות') && ctx.includes('ממוצע')))) {
        bagrutEl = input;
      } else if (!petAllEl && (ctx.includes('רב תחומי') || ctx.includes('רב-תחומי') || (ctx.includes('פסיכומטרי') && ctx.includes('כללי')))) {
        petAllEl = input;
      } else if (!petMathEl && (ctx.includes('דגש כמותי') || (ctx.includes('כמותי') && !ctx.includes('מילולי')))) {
        petMathEl = input;
      } else if (!petVerbalEl && (ctx.includes('דגש מילולי') || (ctx.includes('מילולי') && !ctx.includes('כמותי')))) {
        petVerbalEl = input;
      }
    }

    return { bagrutEl, petAllEl, petMathEl, petVerbalEl };
  }

  /**
   * Ensure HUJI's admission calculator modal is open
   */
  function openHujiCalculator() {
    const fields = findHujiInputs();
    if (fields.bagrutEl || fields.petAllEl) {
      console.log('[Kalis HUJI] Admission calculator is already open.');
      return true;
    }

    console.log('[Kalis HUJI] Opening HUJI admission calculator...');

    // 0. Auto-route via Vue Router Hash if on go.huji.ac.il
    if (window.location.hostname.includes('go.huji.ac.il') && !window.location.hash.includes('admissioncheck')) {
      try {
        window.location.hash = '#/admissioncheck';
        return true;
      } catch (e) {}
    }

    // 1. Fallback: Click #admission-all-link or admission-all-btn
    const link = document.getElementById('admission-all-link');
    if (link) {
      link.click();
      return true;
    }

    const btn = document.getElementById('admission-all-btn') ||
      document.querySelector('admission-all-btn') ||
      document.querySelector('.calc')?.closest('div, a, button');

    if (btn) {
      btn.click();
      return true;
    }

    // 2. Fallback search by text
    const allLinks = Array.from(document.querySelectorAll('a, button, div, span'));
    const textBtn = allLinks.find((el) => {
      const t = (el.textContent || '').trim();
      return t.includes('בדיקת סיכויי הקבלה לכל החוגים') ||
        t.includes('סיכויי קבלה לכל החוגים') ||
        t.includes('בדיקת סיכויי קבלה');
    });

    if (textBtn && typeof textBtn.click === 'function') {
      textBtn.click();
      return true;
    }

    return false;
  }

  /**
   * Bulletproof input setter combining DOM execCommand + events
   */
  function setHujiInput(el, val) {
    if (!el || val === undefined || val === null) return false;
    try {
      try {
        el.focus();
        el.select();
      } catch (e) {}

      const strVal = String(val);

      // Method 1: execCommand('insertText') - native user typing simulation that Vue 2 v-model detects
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, strVal);
      } catch (e) {}

      // Method 2: Prototype setter fallback
      if (!inserted || el.value !== strVal) {
        let setDone = false;
        try {
          const proto = Object.getPrototypeOf(el) || window.HTMLInputElement.prototype;
          const desc = Object.getOwnPropertyDescriptor(proto, 'value') || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          if (desc && desc.set) {
            desc.set.call(el, strVal);
            setDone = true;
          }
        } catch (e) {}

        if (!setDone) {
          try { el.value = strVal; } catch (e) {}
        }

        try {
          if (el._valueTracker && typeof el._valueTracker.setValue === 'function') {
            el._valueTracker.setValue('');
          }
        } catch (e) {}

        try { el.dispatchEvent(new Event('input', { bubbles: true, composed: true })); } catch (e) {}
        try {
          el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: strVal }));
        } catch (e) {}
        try { el.dispatchEvent(new Event('change', { bubbles: true, composed: true })); } catch (e) {}
      }

      try { el.dispatchEvent(new Event('blur', { bubbles: true, composed: true })); } catch (e) {}

      el.style.backgroundColor = '#EBF4EE';
      el.style.borderColor = '#22C55E';
      return true;
    } catch (err) {
      console.warn('[Kalis HUJI] Error setting input value:', err);
      return false;
    }
  }

  /**
   * Dedicated HUJI Autofill Engine
   */
  async function fillHujiForm(candidateData) {
    if (!candidateData) return { handled: false };

    console.log('[Kalis HUJI] Executing autofill for:', candidateData.programName || 'HUJI Track');

    // Step 1: Ensure calculator modal is open
    openHujiCalculator();

    // Step 2: Wait up to 3.5s for fields to appear
    const waitForInputs = async () => {
      const start = Date.now();
      while (Date.now() - start < 3500) {
        const f = findHujiInputs();
        if (f.bagrutEl || f.petAllEl) {
          return true;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    };

    await waitForInputs();
    await new Promise((r) => setTimeout(r, 200));

    const fields = findHujiInputs();
    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    // 1. Fill Bagrut Average
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);
    let formattedAvg = null;

    if (fields.bagrutEl && targetBagrut > 0) {
      formattedAvg = targetBagrut.toFixed(1);
      setHujiInput(fields.bagrutEl, formattedAvg);
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'ממוצע בגרות מותאם',
        value: formattedAvg,
        reason: `הוזן ממוצע בגרות: ${formattedAvg}`
      });
    } else if (fields.bagrutEl) {
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'ממוצע בגרות',
        value: null,
        reason: 'לא הוזן ממוצע בגרות'
      });
    }

    // 2. Fill Psychometric Scores (All 3 Fields: General, Quantitative, Verbal)
    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    const quantScore = hasPsych
      ? Number(candidateData.psychQuantEmphasis || candidateData.psychQuant || candidateData.psychometricScore || 0)
      : null;
    const verbalScore = hasPsych
      ? Number(candidateData.psychVerbalEmphasis || candidateData.psychVerbal || candidateData.psychometricScore || 0)
      : null;

    // General / Multi-Domain
    if (fields.petAllEl && hasPsych) {
      setHujiInput(fields.petAllEl, String(psychScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי כללי (רב-תחומי)',
        value: String(psychScore),
        reason: `הוזן ציון רב-תחומי: ${psychScore}`
      });
    } else if (fields.petAllEl) {
      setHujiInput(fields.petAllEl, '');
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'פסיכומטרי כללי',
        value: null,
        reason: 'מסלול ללא פסיכומטרי / לא נבחן'
      });
    }

    // Quantitative Emphasis (petMath)
    if (fields.petMathEl && hasPsych && quantScore && quantScore >= 200) {
      setHujiInput(fields.petMathEl, String(quantScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש כמותי',
        value: String(quantScore),
        reason: `הוזן ציון בדגש כמותי: ${quantScore}`
      });
    }

    // Verbal Emphasis (petVerbal)
    if (fields.petVerbalEl && hasPsych && verbalScore && verbalScore >= 200) {
      setHujiInput(fields.petVerbalEl, String(verbalScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש מילולי',
        value: String(verbalScore),
        reason: `הוזן ציון בדגש מילולי: ${verbalScore}`
      });
    }

    // Step 3: Inject Main-World Vuex Store Sync
    injectHujiMainWorldSync(
      formattedAvg,
      hasPsych ? psychScore : null,
      quantScore,
      verbalScore
    );

    // Step 4: Trigger Calculation Button (submit step / check admission prospects)
    setTimeout(() => {
      const allButtons = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));
      const submitBtn = allButtons.find((el) => {
        const text = (el.textContent || '').trim();
        return text.includes('לבדיקת סיכויי קבלה') ||
          text.includes('סיכויי קבלה') ||
          el.classList.contains('submit-SingleCourse-singleCourseResults') ||
          el.classList.contains('submit-SingleCourse-submitStep-foreign') ||
          el.classList.contains('submit');
      });

      if (submitBtn && typeof submitBtn.click === 'function') {
        console.log('[Kalis HUJI] Clicking submit button...', submitBtn);
        submitBtn.click();
      }
    }, 450);

    // Step 5: Filter by degree / program inside results view if candidate specified one
    if (candidateData.programName) {
      setTimeout(() => {
        const filterInput = document.querySelector('#admission-container input.search-bar, .search-filters input, .filter-container input');
        if (filterInput && filterInput.value !== candidateData.programName) {
          setHujiInput(filterInput, candidateData.programName);
          filterInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
      }, 1000);
    }

    return {
      handled: true,
      auditLog,
      filledCount,
      skippedCount
    };
  }

  // Hook into KalisDock
  const registerHandler = () => {
    setTimeout(openHujiCalculator, 600);

    const attachCustomHandler = () => {
      if (window.KalisDock) {
        window.KalisDock.customFillHandler = async (candidateData) => {
          return fillHujiForm(candidateData);
        };
      }
    };

    attachCustomHandler();
    setTimeout(attachCustomHandler, 300);
    setTimeout(attachCustomHandler, 1000);

    window.addEventListener('kalis:data-updated', (e) => {
      if (e.detail) {
        console.log('[Kalis HUJI] Re-filling form with updated track data...');
        fillHujiForm(e.detail);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHandler);
  } else {
    registerHandler();
  }

  // Watch for HUJI calculation results in DOM
  const observeResults = () => {
    const observer = new MutationObserver(() => {
      const resultsContainer = document.querySelector('.results-container, #admission-container, .course-results');
      if (resultsContainer) {
        const text = resultsContainer.textContent || '';
        if (text.includes('קבלה') || text.includes('דחייה') || text.includes('המתנה')) {
          const decision = text.includes('קבלה') ? 'ACCEPTED' : (text.includes('דחייה') ? 'REJECTED' : 'WAITLIST');
          console.log('[Kalis HUJI] Captured admission decision:', decision);
          window.postMessage({
            type: 'KALIS_INSTITUTION_CALCULATED_RESULTS',
            decision: decision
          }, '*');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  setTimeout(observeResults, 1200);

  console.log('[Kalis HUJI] Dedicated engine initialized.');
})();


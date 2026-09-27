// Kalis Dedicated Content Script: Hebrew University of Jerusalem (HUJI)
// Target: go.huji.ac.il/* and *.huji.ac.il/*
// Automates: Opening admission calculator modal + live input of Bagrut average & Psychometric scores

(function () {
  'use strict';
  console.log('[Kalis HUJI] Dedicated script loaded on:', window.location.href);

  /**
   * Ensure HUJI's admission calculator modal is open
   */
  function openHujiCalculator() {
    // 1. Check if calculator input fields already exist in DOM
    if (document.getElementById('bagrut') && document.getElementById('petAll')) {
      console.log('[Kalis HUJI] Admission calculator is already open.');
      return true;
    }

    console.log('[Kalis HUJI] Opening HUJI admission calculator...');

    // 2. Try direct Vue store commit if accessible
    try {
      const appEl = document.querySelector('#app, [data-v-app]');
      if (appEl && appEl.__vue__ && appEl.__vue__.$store) {
        appEl.__vue__.$store.commit('setCheckAdmission', true);
        appEl.__vue__.$store.commit('setAdmissionAll', true);
        console.log('[Kalis HUJI] Dispatched setAdmissionAll to Vuex store.');
        return true;
      }
    } catch (e) {
      console.warn('[Kalis HUJI] Vuex direct access note:', e);
    }

    // 3. Fallback: Click #admission-all-link or admission-all-btn
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

    // 4. Fallback search by text
    const allLinks = Array.from(document.querySelectorAll('a, button, div, span'));
    const textBtn = allLinks.find((el) => {
      const t = (el.textContent || '').trim();
      return t.includes('בדיקת סיכויי הקבלה לכל החוגים') || t.includes('סיכויי קבלה לכל החוגים');
    });

    if (textBtn && typeof textBtn.click === 'function') {
      textBtn.click();
      return true;
    }

    return false;
  }

  /**
   * Helper to set input value with Vue-compatible events
   */
  function setVueInput(el, val) {
    if (!el || val === undefined || val === null) return false;
    el.focus();
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
    el.style.backgroundColor = '#EBF4EE';
    el.style.borderColor = '#22C55E';
    return true;
  }

  /**
   * Dedicated HUJI Autofill Engine
   */
  async function fillHujiForm(candidateData, setValFn) {
    if (!candidateData) return { handled: false };

    console.log('[Kalis HUJI] Executing autofill for:', candidateData.programName || 'HUJI Track');

    const setter = setValFn || setVueInput;

    // Step 1: Ensure calculator modal is open
    openHujiCalculator();

    // Step 2: Wait up to 3.5s for #bagrut and #petAll to appear
    const waitForInputs = async () => {
      const start = Date.now();
      while (Date.now() - start < 3500) {
        if (document.getElementById('bagrut') || document.getElementById('petAll')) {
          return true;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    };

    const inputsReady = await waitForInputs();
    if (!inputsReady) {
      console.warn('[Kalis HUJI] Calculator fields did not appear in time.');
      // Attempt once more to open
      openHujiCalculator();
      await new Promise((r) => setTimeout(r, 400));
    }

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    // 1. Fill Bagrut Average
    const bagrutEl = document.getElementById('bagrut');
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);

    if (bagrutEl && targetBagrut > 0) {
      const formattedAvg = targetBagrut.toFixed(1);
      setter(bagrutEl, formattedAvg);
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'ממוצע בגרות מותאם',
        value: formattedAvg,
        reason: `הוזן ממוצע בגרות: ${formattedAvg}`
      });
    } else if (bagrutEl) {
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'ממוצע בגרות',
        value: null,
        reason: 'לא הוזן ממוצע בגרות'
      });
    }

    // 2. Fill Psychometric Scores
    const petAllEl = document.getElementById('petAll');
    const petMathEl = document.getElementById('petMath');
    const petVerbalEl = document.getElementById('petVerbal');

    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    if (petAllEl && hasPsych) {
      setter(petAllEl, String(psychScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי כללי (רב-תחומי)',
        value: String(psychScore),
        reason: `הוזן ציון רב-תחומי: ${psychScore}`
      });
    } else if (petAllEl) {
      setter(petAllEl, '');
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'פסיכומטרי כללי',
        value: null,
        reason: 'מסלול ללא פסיכומטרי / לא נבחן'
      });
    }

    // 3. Quantitative Emphasis (petMath)
    const quantScore = Number(candidateData.psychQuantEmphasis || candidateData.psychQuant || 0);
    if (petMathEl && hasPsych && quantScore >= 200) {
      setter(petMathEl, String(quantScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש כמותי',
        value: String(quantScore),
        reason: `הוזן ציון בדגש כמותי: ${quantScore}`
      });
    }

    // 4. Verbal Emphasis (petVerbal)
    const verbalScore = Number(candidateData.psychVerbalEmphasis || candidateData.psychVerbal || 0);
    if (petVerbalEl && hasPsych && verbalScore >= 200) {
      setter(petVerbalEl, String(verbalScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש מילולי',
        value: String(verbalScore),
        reason: `הוזן ציון בדגש מילולי: ${verbalScore}`
      });
    }

    // 5. Filter by degree / program inside results view (WITHOUT navigating away!)
    if (candidateData.programName) {
      setTimeout(() => {
        const filterInput = document.querySelector('#admission-container input.search-bar, .search-filters input, .filter-container input');
        if (filterInput && filterInput.value !== candidateData.programName) {
          setter(filterInput, candidateData.programName);
          filterInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
      }, 700);
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
    // Open calculator on initial load
    setTimeout(openHujiCalculator, 600);

    if (window.KalisDock) {
      window.KalisDock.customFillHandler = async (candidateData, setter) => {
        return fillHujiForm(candidateData, setter);
      };

      // Listen for data update events when user switches tracks in web app
      window.addEventListener('kalis:data-updated', (e) => {
        if (e.detail) {
          console.log('[Kalis HUJI] Re-filling form with updated track data...');
          fillHujiForm(e.detail);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHandler);
  } else {
    registerHandler();
  }

  console.log('[Kalis HUJI] Dedicated engine initialized.');
})();

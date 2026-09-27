// Kalis Dedicated Content Script: Hebrew University of Jerusalem (HUJI)
// Target: go.huji.ac.il/* and *.huji.ac.il/*
// Automates: Opening admission calculator modal + live input of Bagrut average & Psychometric scores (all 3 emphases)

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
   * Bulletproof input setter combining DOM dispatch & Vuex store sync
   */
  function setHujiInput(el, val, vuexKey, subKey) {
    if (!el || val === undefined || val === null) return false;
    try {
      el.focus();

      // Native setter on HTMLInputElement prototype
      const proto = window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, String(val));
      } else {
        el.value = String(val);
      }

      // Dispatch full input events sequence for Vue 2 v-model / @input
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      try {
        el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: String(val) }));
      } catch (e) {}
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));

      // Direct Vuex store synchronization
      try {
        const appEl = document.querySelector('#app, [data-v-app]');
        if (appEl && appEl.__vue__ && appEl.__vue__.$store) {
          if (vuexKey === 'bagrut') {
            appEl.__vue__.$store.commit('setGradeByKey', { key: 'bagrut', value: String(val) });
          } else if (vuexKey === 'pet' && subKey) {
            appEl.__vue__.$store.commit('setGradePetByKey', { key: subKey, value: String(val) });
          }
        }
      } catch (vueErr) {
        console.warn('[Kalis HUJI] Vuex direct commit notice:', vueErr);
      }

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

    // Step 2: Wait up to 4s for BOTH #bagrut AND #petAll to appear
    const waitForInputs = async () => {
      const start = Date.now();
      while (Date.now() - start < 4000) {
        if (document.getElementById('bagrut') && document.getElementById('petAll')) {
          return true;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      // If at least bagrut is ready, proceed
      return Boolean(document.getElementById('bagrut'));
    };

    await waitForInputs();

    // Small delay to ensure Vue DOM animation settles
    await new Promise((r) => setTimeout(r, 200));

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    // 1. Fill Bagrut Average
    const bagrutEl = document.getElementById('bagrut');
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);

    if (bagrutEl && targetBagrut > 0) {
      const formattedAvg = targetBagrut.toFixed(1);
      setHujiInput(bagrutEl, formattedAvg, 'bagrut');
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

    // 2. Fill Psychometric Scores (All 3 Fields: General, Quantitative, Verbal)
    const petAllEl = document.getElementById('petAll') || document.querySelector('input[name="petAll"]');
    const petMathEl = document.getElementById('petMath') || document.querySelector('input[name="petMath"]');
    const petVerbalEl = document.getElementById('petVerbal') || document.querySelector('input[name="petVerbal"]');

    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    // General / Multi-Domain
    if (petAllEl && hasPsych) {
      setHujiInput(petAllEl, String(psychScore), 'pet', 'multi');
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי כללי (רב-תחומי)',
        value: String(psychScore),
        reason: `הוזן ציון רב-תחומי: ${psychScore}`
      });
    } else if (petAllEl) {
      setHujiInput(petAllEl, '', 'pet', 'multi');
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'פסיכומטרי כללי',
        value: null,
        reason: 'מסלול ללא פסיכומטרי / לא נבחן'
      });
    }

    // Quantitative Emphasis (petMath)
    const quantScore = Number(candidateData.psychQuantEmphasis || candidateData.psychQuant || candidateData.psychometricScore || 0);
    if (petMathEl && hasPsych && quantScore >= 200) {
      setHujiInput(petMathEl, String(quantScore), 'pet', 'quantity');
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש כמותי',
        value: String(quantScore),
        reason: `הוזן ציון בדגש כמותי: ${quantScore}`
      });
    }

    // Verbal Emphasis (petVerbal)
    const verbalScore = Number(candidateData.psychVerbalEmphasis || candidateData.psychVerbal || candidateData.psychometricScore || 0);
    if (petVerbalEl && hasPsych && verbalScore >= 200) {
      setHujiInput(petVerbalEl, String(verbalScore), 'pet', 'verbal');
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי בדגש מילולי',
        value: String(verbalScore),
        reason: `הוזן ציון בדגש מילולי: ${verbalScore}`
      });
    }

    // 3. Trigger Calculation Button (submit step / check admission prospects)
    setTimeout(() => {
      const submitBtn = document.querySelector(
        '.submit.submit-SingleCourse-singleCourseResults, .submit-SingleCourse-submitStep-foreign, .submit, button.submit, [role="button"].submit'
      );
      if (submitBtn) {
        console.log('[Kalis HUJI] Clicking submit button...');
        submitBtn.click();
      }
    }, 450);

    // 4. Filter by degree / program inside results view if candidate specified one
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
    // Open calculator on initial load
    setTimeout(openHujiCalculator, 600);

    if (window.KalisDock) {
      window.KalisDock.customFillHandler = async (candidateData) => {
        return fillHujiForm(candidateData);
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

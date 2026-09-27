// Kalis Dedicated Content Script: Tel Aviv University (TAU)
// Target: go.tau.ac.il/he/calculator and *.tau.ac.il/*
// Automates: Maturity (Bagrut average), Psychometric General, Realit Bonus checkbox, and Calculation

(function () {
  'use strict';
  console.log('[Kalis TAU] Dedicated script loaded on:', window.location.href);

  /**
   * Dedicated TAU Autofill Engine
   */
  async function fillTauForm(candidateData, setValFn) {
    if (!candidateData) return { handled: false };

    console.log('[Kalis TAU] Executing autofill for:', candidateData.programName || 'TAU Track');

    const setter = setValFn || (window.KalisDock && window.KalisDock.setElementValue);
    if (!setter) return { handled: false };

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    // 1. Bagrut Average Field (TAU React uses name="maturity")
    const maturityInput = document.querySelector('input[name="maturity"], input#formMaturity, [aria-label*="בגרות"]');
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);

    if (maturityInput && targetBagrut > 0) {
      const formattedAvg = targetBagrut.toFixed(1);
      setter(maturityInput, formattedAvg);
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

    // 2. Psychometric General Field (TAU React uses name="psychometric")
    const psychInput = document.querySelector('input[name="psychometric"], input#formPsychometric, [aria-label*="פסיכומטרי"]');
    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    if (psychInput && hasPsych) {
      setter(psychInput, String(psychScore));
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'פסיכומטרי כללי (רב-תחומי)',
        value: String(psychScore),
        reason: `הוזן ציון רב-תחומי: ${psychScore}`
      });
    } else if (psychInput) {
      setter(psychInput, '');
      skippedCount++;
      auditLog.push({
        status: 'SKIPPED_NO_DATA',
        label: 'פסיכומטרי כללי',
        value: null,
        reason: 'ללא פסיכומטרי'
      });
    }

    // 3. Realit Bonus Checkbox (5u Math + 5u Physics)
    const realitCheckbox = document.querySelector('input[type="checkbox"][name*="real"], input[type="checkbox"][id*="real"], input[type="checkbox"][name*="check"]');
    if (realitCheckbox) {
      const subjects = candidateData.subjects || [];
      const mathSub = subjects.find((s) => s.name && s.name.includes('מתמטיקה'));
      const phySub = subjects.find((s) => s.name && s.name.includes('פיזיקה'));
      const isEligible = Boolean(
        mathSub && Number(mathSub.units) === 5 && Number(mathSub.grade) >= 55 &&
        phySub && Number(phySub.units) === 5 && Number(phySub.grade) >= 55
      );

      setter(realitCheckbox, isEligible);
      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: 'בונוס ריאלי (5 יח״ל פיזיקה ומתמטיקה)',
        value: isEligible ? 'מסומן ✓' : 'לא מסומן',
        reason: isEligible ? 'זכאי לבונוס ריאלי' : 'אינו עומד בתנאי הבונוס'
      });
    }

    // 4. Trigger TAU Calculate Button
    setTimeout(() => {
      const calcBtn = document.querySelector('button.save-btn, button[variant="primary"], button.btn-primary, [role="button"][class*="save"]');
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
      window.KalisDock.customFillHandler = async (candidateData, setter) => {
        return fillTauForm(candidateData, setter);
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

  console.log('[Kalis TAU] Dedicated engine initialized.');
})();

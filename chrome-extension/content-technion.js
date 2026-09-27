// Kalis Dedicated Content Script: Technion Admissions Calculator AutoFill
// Target: admissions.technion.ac.il/calculator/*
// Full Form Automation: Core Subjects + Dynamic Electives + Psychometric + Live Calculation

(function () {
  'use strict';
  console.log('[Kalis Technion] Dedicated script loaded on:', window.location.href);

  // Core subjects mapping to Technion field IDs
  const TECHNION_CORE_FIELDS = [
    {
      key: 'math',
      keywords: ['מתמטיקה', 'מתמטי', 'math'],
      unitsId: 'yMathematic',
      gradeId: 'mathematic',
      label: 'מתמטיקה'
    },
    {
      key: 'english',
      keywords: ['אנגלית', 'english'],
      unitsId: 'yEnglish',
      gradeId: 'english',
      label: 'אנגלית'
    },
    {
      key: 'bible',
      keywords: ['תנ"ך', 'תנך', 'מקרא', 'bible'],
      unitsId: 'yBible',
      gradeId: 'bible',
      label: 'תנ״ך'
    },
    {
      key: 'civics',
      keywords: ['אזרחות', 'civics', 'ezrahut'],
      unitsId: 'yEzrahut',
      gradeId: 'ezrahut',
      label: 'אזרחות'
    },
    {
      key: 'hebrew_expression',
      keywords: ['הבעה', 'עברית (הבעה)', 'לשון', 'הבעה עברית', 'עברית', 'habaa'],
      unitsId: 'yHabaa',
      gradeId: 'habaa',
      label: 'עברית (הבעה)'
    },
    {
      key: 'literature',
      keywords: ['ספרות', 'ספרות עברית', 'literature', 'hebrew_lit'],
      unitsId: 'yHebrew_lit',
      gradeId: 'hebrew_lit',
      label: 'ספרות עברית'
    },
    {
      key: 'history',
      keywords: ['היסטוריה', 'history', 'תולדות עם ישראל'],
      unitsId: 'yHistory',
      gradeId: 'history',
      label: 'היסטוריה'
    }
  ];

  function normalize(str) {
    if (!str) return '';
    return String(str).toLowerCase().replace(/["״'׳\-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Complete form reset before applying new track data to prevent leftover numbers
   */
  function clearTechnionForm() {
    console.log('[Kalis Technion] Resetting form to clean slate...');

    // 0. Trigger native Technion clean_form button if available
    const nativeClean = document.getElementById('clean_form');
    if (nativeClean && typeof nativeClean.click === 'function') {
      try { nativeClean.click(); } catch (e) {}
    }

    // Close any existing open jQuery UI modal dialog
    try {
      if (window.jQuery && window.jQuery('#dialog').length && typeof window.jQuery('#dialog').dialog === 'function') {
        window.jQuery('#dialog').dialog('close');
      }
    } catch (e) {}
    const dialogEl = document.getElementById('dialog');
    if (dialogEl) {
      dialogEl.style.display = 'none';
      dialogEl.innerHTML = '';
    }

    // 1. Reset Core Subjects
    TECHNION_CORE_FIELDS.forEach((core) => {
      const uEl = document.getElementById(core.unitsId);
      const gEl = document.getElementById(core.gradeId);
      if (uEl) {
        uEl.value = '0';
        uEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (gEl) {
        gEl.value = '';
        gEl.dispatchEvent(new Event('input', { bubbles: true }));
        gEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // 2. Reset Elective Rows (1 through 6)
    for (let i = 1; i <= 6; i++) {
      const sSelect = document.getElementById(`mikztootBhira_${i}`);
      const uSelect = document.getElementById(`y${i}`);
      const gInput = document.getElementById(`G_${i}`);
      const row = document.getElementById(`bhira${i}`);

      if (sSelect) {
        sSelect.selectedIndex = 0;
        sSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (uSelect) {
        uSelect.value = '0';
        uSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (gInput) {
        gInput.value = '';
        gInput.dispatchEvent(new Event('input', { bubbles: true }));
        gInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (i > 1 && row) {
        row.style.display = 'none';
      }
    }

    // 3. Reset Psychometric
    const psychInput = document.getElementById('psychometry');
    if (psychInput) {
      psychInput.value = '';
      psychInput.dispatchEvent(new Event('input', { bubbles: true }));
      psychInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Dedicated Autofill Engine for Technion
   */
  function fillTechnionForm(candidateData, setValFn) {
    if (!candidateData || !candidateData.subjects) {
      return { handled: false };
    }

    console.log('[Kalis Technion] Starting dedicated autofill for:', candidateData.programName || 'Technion Track');

    const setter = setValFn || (window.KalisDock && window.KalisDock.setElementValue) || ((el, val) => {
      if (!el) return false;
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    });

    // Ensure Bagrut section is expanded
    const bagrotRadio = document.querySelector('#bagrotYes, input[name="bagrot"][value="yes"]');
    if (bagrotRadio && !bagrotRadio.checked) {
      bagrotRadio.checked = true;
      bagrotRadio.dispatchEvent(new Event('click', { bubbles: true }));
      bagrotRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const bagrotForm = document.getElementById('bagrotForm');
    if (bagrotForm) bagrotForm.style.display = 'block';

    // Clear old values so switching tracks never carries over stale data
    clearTechnionForm();

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    const subjects = candidateData.subjects || [];
    const usedSubjects = new Set();

    // 1. Fill Core Subjects
    TECHNION_CORE_FIELDS.forEach((core) => {
      const match = subjects.find((s) => {
        const normName = normalize(s.name);
        return core.keywords.some((kw) => normName.includes(normalize(kw)));
      });

      const uEl = document.getElementById(core.unitsId);
      const gEl = document.getElementById(core.gradeId);

      if (match && Number(match.grade) > 0) {
        usedSubjects.add(match);
        let uSuccess = false;
        let gSuccess = false;

        if (uEl && match.units) {
          uSuccess = setter(uEl, match.units);
        }
        if (gEl && match.grade) {
          gSuccess = setter(gEl, match.grade);
        }

        if (uSuccess || gSuccess) {
          filledCount++;
          auditLog.push({
            status: 'FILLED',
            label: core.label,
            value: `${match.units} יח״ל — ציון ${match.grade}`,
            reason: `הוזן מקצוע חובה: ${core.label}`
          });
        }
      } else {
        skippedCount++;
        auditLog.push({
          status: 'SKIPPED_NO_DATA',
          label: core.label,
          value: null,
          reason: `לא נמצאו ציונים עבור ${core.label} — הושאר ריק`
        });
      }
    });

    // 2. Fill Electives (up to 6 rows)
    const electives = subjects.filter((s) => !usedSubjects.has(s) && Number(s.grade) > 0);
    let electiveRow = 1;

    electives.forEach((elective) => {
      if (electiveRow > 6) return;

      const sSelect = document.getElementById(`mikztootBhira_${electiveRow}`);
      const uSelect = document.getElementById(`y${electiveRow}`);
      const gInput = document.getElementById(`G_${electiveRow}`);
      const row = document.getElementById(`bhira${electiveRow}`);

      if (electiveRow > 1 && row) {
        row.style.display = 'table-row';
      }

      let matchedOption = null;
      if (sSelect && sSelect.options) {
        const normElective = normalize(elective.name);
        for (let j = 0; j < sSelect.options.length; j++) {
          const optText = normalize(sSelect.options[j].text || sSelect.options[j].value);
          if (
            optText.includes(normElective) ||
            normElective.includes(optText) ||
            (normElective.includes('פיזיקה') && optText.includes('פיזיקה')) ||
            (normElective.includes('כימיה') && optText.includes('כימיה')) ||
            (normElective.includes('מחשב') && optText.includes('מדעי המחשב')) ||
            (normElective.includes('ביולוגיה') && optText.includes('ביולוגיה')) ||
            (normElective.includes('גיאוגרפיה') && optText.includes('גיאוגרפיה'))
          ) {
            matchedOption = sSelect.options[j];
            break;
          }
        }

        if (matchedOption) {
          setter(sSelect, matchedOption.value);
        }
      }

      if (uSelect && elective.units) {
        setter(uSelect, elective.units);
      }

      if (gInput && elective.grade) {
        setter(gInput, elective.grade);
      }

      filledCount++;
      auditLog.push({
        status: 'FILLED',
        label: `מקצוע בחירה: ${elective.name}`,
        value: `${elective.units} יח״ל — ציון ${elective.grade}`,
        reason: `הוזן מקצוע בחירה ${electiveRow} (${matchedOption ? matchedOption.text : elective.name})`
      });

      electiveRow++;
    });

    // 3. Fill Psychometric
    const psychScore = Number(candidateData.psychometricScore || 0);
    const psychInput = document.getElementById('psychometry');
    if (psychInput) {
      // Unhide psychometry container if hidden
      const pContainer = psychInput.closest('.two-column-part-two');
      if (pContainer) pContainer.style.display = 'block';
      const pLabel = document.querySelector('.two-column-part-one:has(label[for="psychometry"])') ||
                     document.querySelector('label[for="psychometry"]')?.closest('.two-column-part-one');
      if (pLabel) pLabel.style.display = 'block';

      if (psychScore >= 200 && psychScore <= 800) {
        setter(psychInput, psychScore);
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'פסיכומטרי כללי (רב-תחומי)',
          value: String(psychScore),
          reason: `הוזן ציון פסיכומטרי: ${psychScore}`
        });
      } else {
        skippedCount++;
        auditLog.push({
          status: 'SKIPPED_NO_DATA',
          label: 'ציון פסיכומטרי',
          value: null,
          reason: 'ללא פסיכומטרי'
        });
      }
    }

    // 4. Trigger Technion optimal average and final Sekem calculation
    setTimeout(() => {
      const optBtn = document.getElementById('optimal_averaging');
      if (optBtn) {
        console.log('[Kalis Technion] Clicking optimal averaging button...');
        optBtn.click();

        // Technion unhides #calculate_sum after optimal average is calculated
        setTimeout(() => {
          // Re-affirm psychometric input right before calculate_sum in case optimal_averaging reset it
          const psychInputReaffirm = document.getElementById('psychometry');
          if (psychInputReaffirm && psychScore >= 200 && psychScore <= 800) {
            setter(psychInputReaffirm, psychScore);
          }

          const calcBtn = document.getElementById('calculate_sum');
          if (calcBtn) {
            console.log('[Kalis Technion] Clicking calculate sum button...');
            calcBtn.click();
          }
        }, 800);
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
    if (window.KalisDock) {
      window.KalisDock.customFillHandler = async (candidateData, setter) => {
        return fillTechnionForm(candidateData, setter);
      };

      // Listen for data update events when user switches tracks in web app
      window.addEventListener('kalis:data-updated', (e) => {
        if (e.detail) {
          console.log('[Kalis Technion] Re-filling form with updated track data...');
          fillTechnionForm(e.detail);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHandler);
  } else {
    registerHandler();
  }

  // Watch for Technion calculation dialog result to capture Sekem
  const observeResults = () => {
    const dialogEl = document.getElementById('dialog');
    if (!dialogEl) return;

    const observer = new MutationObserver(() => {
      const text = dialogEl.textContent || '';
      if (text.includes('סכם') || text.includes('הסכם')) {
        // Strict priority matching for Technion official admission Sekem:
        let sekemQuantity = null;

        const p1 = text.match(/הסכם לדיוני הקבלה הוא:?\s*(\d{2,3}(?:\.\d{1,2})?)/);
        const p2 = text.match(/סכם לפי ממוצע בגרות מיטבי והציון הפסיכומטרי הרב תחומי:?\s*(\d{2,3}(?:\.\d{1,2})?)/);
        const p3 = text.match(/סכם לדיוני הקבלה[:\s]+(\d{2,3}(?:\.\d{1,2})?)/);
        const p4 = text.match(/הסכם הוא:?\s*(\d{2,3}(?:\.\d{1,2})?)/);

        if (p1 && p1[1]) sekemQuantity = p1[1];
        else if (p2 && p2[1]) sekemQuantity = p2[1];
        else if (p3 && p3[1]) sekemQuantity = p3[1];
        else if (p4 && p4[1]) sekemQuantity = p4[1];

        // Optimal Bagrut average (115.2) vs unweighted average (90.6)
        const avgOptimal = text.match(/ממוצע בגרות מיטבי:?\s*(\d{2,3}(?:\.\d{1,2})?)/);
        const avgUnweighted = text.match(/ממוצע ציוני הבגרות ללא בונוסים:?\s*(\d{2,3}(?:\.\d{1,2})?)/);
        const bagrutAverage = avgOptimal ? avgOptimal[1] : (avgUnweighted ? avgUnweighted[1] : null);

        if (sekemQuantity) {
          console.log('[Kalis Technion] Captured official Technion Sekem:', sekemQuantity, 'Optimal Average:', bagrutAverage);
          window.postMessage({
            type: 'KALIS_INSTITUTION_CALCULATED_RESULTS',
            sekemQuantity: sekemQuantity,
            bagrutAverage: bagrutAverage
          }, '*');
        }
      }
    });

    observer.observe(dialogEl, { childList: true, subtree: true, characterData: true });
  };

  setTimeout(observeResults, 1200);

  console.log('[Kalis Technion] Dedicated engine initialized.');
})();

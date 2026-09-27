// Kalis Dedicated Content Script: Bar-Ilan University (BIU)
// Target: shoham.biu.ac.il/kabala/Psychometric.aspx and *.biu.ac.il/*
// Automates: Bagrut average (משוקלל), Psychometric general, Math/English/Physics units & grades,
// Psychometric math subscore (1-150), and Calculation execution

(function () {
  'use strict';
  console.log('[Kalis BIU] Dedicated script loaded on:', window.location.href);

  /**
   * Helper: Normalize text for matching
   */
  function normalize(str) {
    if (!str) return '';
    return str
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/["'״׳]/g, '')
      .replace(/[-_–—/\\()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Helper: Find table row or container by matching labels
   */
  function findRowByText(searchTexts) {
    const allRows = Array.from(document.querySelectorAll('tr, .form-group, .row, div'));
    const terms = Array.isArray(searchTexts) ? searchTexts.map(normalize) : [normalize(searchTexts)];

    for (const row of allRows) {
      const rowText = normalize(row.textContent || '');
      // Ensure all terms match
      if (terms.every((t) => rowText.includes(t))) {
        // Find deepest matching element that contains inputs
        const hasInputs = row.querySelector('input, select');
        if (hasInputs) return row;
      }
    }
    return null;
  }

  /**
   * Dedicated BIU Autofill Engine
   */
  async function fillBiuForm(candidateData, setValFn) {
    if (!candidateData) return { handled: false };

    console.log('[Kalis BIU] Executing autofill for:', candidateData.programName || 'BIU Track');

    const setter = setValFn || (window.KalisDock && window.KalisDock.setElementValue);
    if (!setter) return { handled: false };

    const auditLog = [];
    let filledCount = 0;
    let skippedCount = 0;

    const subjects = candidateData.subjects || [];

    // 1. Bagrut Average Field (ציון בגרות משוקלל 1-130)
    const bagrutRow = findRowByText(['ציון בגרות משוקלל']) ||
      findRowByText(['בגרות משוקלל']) ||
      findRowByText(['1 130']) ||
      findRowByText(['130']);
    const targetBagrut = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);

    if (bagrutRow && targetBagrut > 0) {
      const bagrutInput = bagrutRow.querySelector('input[type="text"], input[type="number"], input:not([type])');
      if (bagrutInput) {
        const formattedAvg = targetBagrut.toFixed(1);
        setter(bagrutInput, formattedAvg);
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'ציון בגרות משוקלל',
          value: formattedAvg,
          reason: `הוזן ממוצע משוקלל: ${formattedAvg}`
        });
      }
    } else if (targetBagrut > 0) {
      // Fallback: search by input name / id
      const bagrutInput = document.querySelector('input[name*="Bagrut"], input[name*="bagrut"], input[id*="Bagrut"], input[id*="bagrut"]');
      if (bagrutInput) {
        const formattedAvg = targetBagrut.toFixed(1);
        setter(bagrutInput, formattedAvg);
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'ציון בגרות משוקלל',
          value: formattedAvg,
          reason: `הוזן ממוצע משוקלל: ${formattedAvg}`
        });
      }
    }

    // 2. Psychometric General Field (ציון בחינה פסיכומטרית 200-800)
    const psychRow = findRowByText(['ציון בחינה פסיכומטרית']) ||
      findRowByText(['בחינה פסיכומטרית']) ||
      findRowByText(['800 200']) ||
      findRowByText(['200 800']);
    const psychScore = Number(candidateData.psychometricScore || 0);
    const hasPsych = Boolean(candidateData.hasTakenPsychometric !== false && psychScore >= 200);

    if (psychRow && hasPsych) {
      const psychInput = psychRow.querySelector('input[type="text"], input[type="number"], input:not([type])');
      if (psychInput) {
        setter(psychInput, String(psychScore));
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'ציון בחינה פסיכומטרית',
          value: String(psychScore),
          reason: `הוזן ציון רב-תחומי: ${psychScore}`
        });
      }
    } else if (hasPsych) {
      const psychInput = document.querySelector('input[name*="Psychometric"], input[name*="psychometric"], input[id*="Psychometric"]');
      if (psychInput) {
        setter(psychInput, String(psychScore));
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'ציון בחינה פסיכומטרית',
          value: String(psychScore),
          reason: `הוזן ציון רב-תחומי: ${psychScore}`
        });
      }
    }

    // 3. Helper to populate a subject row (Select units + Input grade)
    function fillSubjectRow(rowKeywords, subjectKey, subjectNameHe) {
      const sub = subjects.find((s) => s.name && (
        normalize(s.name).includes(normalize(subjectNameHe)) ||
        (subjectKey === 'math' && s.name.includes('מתמטיקה')) ||
        (subjectKey === 'english' && s.name.includes('אנגלית')) ||
        (subjectKey === 'physics' && s.name.includes('פיזיקה')) ||
        (subjectKey === 'chemistry' && s.name.includes('כימיה')) ||
        (subjectKey === 'biology' && s.name.includes('ביולוגיה'))
      ));

      const row = findRowByText(rowKeywords);
      if (!row) return;

      const selectEl = row.querySelector('select');
      const inputEl = row.querySelector('input[type="text"], input[type="number"], input:not([type])');

      if (sub && sub.units && selectEl) {
        // Find matching option for units
        const unitsStr = String(sub.units);
        for (let i = 0; i < selectEl.options.length; i++) {
          const opt = selectEl.options[i];
          if (opt.value === unitsStr || opt.text.includes(unitsStr)) {
            setter(selectEl, opt.value);
            break;
          }
        }
      }

      if (sub && sub.grade && inputEl) {
        setter(inputEl, String(sub.grade));
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: `${subjectNameHe}: ${sub.units} יח״ל`,
          value: `ציון ${sub.grade}`,
          reason: `הוזנו נתוני ${subjectNameHe}`
        });
      } else if (inputEl) {
        skippedCount++;
        auditLog.push({
          status: 'SKIPPED_NO_DATA',
          label: subjectNameHe,
          value: null,
          reason: `לא נלמד אצל המועמד`
        });
      }
    }

    // Fill Math (ציון בגרות במתמטיקה 1-100)
    fillSubjectRow(['בגרות במתמטיקה'], 'math', 'מתמטיקה');

    // Fill English (ציון בגרות באנגלית 1-100)
    fillSubjectRow(['בגרות באנגלית'], 'english', 'אנגלית');

    // Fill Physics (ציון בגרות בפיזיקה 100-1)
    fillSubjectRow(['בגרות בפיזיקה'], 'physics', 'פיזיקה');

    // Fill Chemistry (ציון בגרות בכימיה 100-1)
    fillSubjectRow(['בגרות בכימיה'], 'chemistry', 'כימיה');

    // Fill Biology (ציון בגרות בביולוגיה 100-1)
    fillSubjectRow(['בגרות בביולוגיה'], 'biology', 'ביולוגיה');

    // 4. Psychometric Math Subscore (ציון מתמטיקה בפסיכומטרי 1-150)
    // Strictly in 50-150 range. NEVER put Bagrut math grade here!
    const psychMathRow = findRowByText(['מתמטיקה בפסיכומטרי']) || findRowByText(['150 1']) || findRowByText(['1 150']);
    const psychQuantScore = Number(candidateData.psychQuant || 0);

    if (psychMathRow) {
      const qInput = psychMathRow.querySelector('input[type="text"], input[type="number"], input:not([type])');
      if (qInput && psychQuantScore >= 50 && psychQuantScore <= 150) {
        setter(qInput, String(psychQuantScore));
        filledCount++;
        auditLog.push({
          status: 'FILLED',
          label: 'ציון מתמטיקה בפסיכומטרי (1-150)',
          value: String(psychQuantScore),
          reason: `ציון כמותי פסיכומטרי: ${psychQuantScore}`
        });
      } else if (qInput) {
        setter(qInput, '');
        skippedCount++;
        auditLog.push({
          status: 'SKIPPED_NO_DATA',
          label: 'ציון מתמטיקה בפסיכומטרי (1-150)',
          value: null,
          reason: 'אין ציון כמותי בסולם 150 — השדה נותר ריק'
        });
      }
    }

    // 5. Trigger BIU Calculate Button
    setTimeout(() => {
      const calcBtn = document.querySelector('input[type="submit"][value*="חשב"], button:contains("חשב"), input#btnCalculate, input[name*="Calculate"]');
      if (calcBtn) {
        console.log('[Kalis BIU] Clicking calculate button...');
        calcBtn.click();
      }
    }, 450);

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
        return fillBiuForm(candidateData, setter);
      };

      // Listen for data update events when user switches tracks in web app
      window.addEventListener('kalis:data-updated', (e) => {
        if (e.detail) {
          console.log('[Kalis BIU] Re-filling form with updated track data...');
          fillBiuForm(e.detail);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHandler);
  } else {
    registerHandler();
  }

  // Watch for BIU calculation results
  const observeResults = () => {
    const observer = new MutationObserver(() => {
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('תוצאות') || bodyText.includes('קבלה') || bodyText.includes('סכם')) {
        const sekemMatch = bodyText.match(/סכם[:\s]+(\d{2,3}(?:\.\d{1,2})?)/) ||
          bodyText.match(/ציון התאמה[:\s]+(\d{2,3}(?:\.\d{1,2})?)/);

        if (sekemMatch) {
          console.log('[Kalis BIU] Captured calculated Sekem:', sekemMatch[1]);
          window.postMessage({
            type: 'KALIS_INSTITUTION_CALCULATED_RESULTS',
            sekemQuantity: sekemMatch[1],
            decision: bodyText.includes('קבלה') ? 'ACCEPTED' : (bodyText.includes('דחייה') ? 'REJECTED' : null)
          }, '*');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  setTimeout(observeResults, 1200);

  console.log('[Kalis BIU] Dedicated engine initialized.');
})();

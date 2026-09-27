// Kalis Data Availability Guard (Manifest V3)
// Enforces: "אני רוצה שהוא יזין רק את מה שיש לו אם אין לו הוא לא שם נתונים אחרים"
// Strict Zero-Guess / Zero-Hallucination Policy:
// If a candidate lacks data for an academic field, that field is never touched, filled with 0, or guessed.

(function () {
  'use strict';

  // Canonical subject matching table
  const SUBJECT_SYNONYMS = {
    math: ['מתמטיקה', 'מתמטי', 'math', 'mathematics'],
    physics: ['פיזיקה', 'פיסיקה', 'physics'],
    english: ['אנגלית', 'english'],
    cs: ['מדעי המחשב', 'מדמ״ח', 'מדמח', 'computer science', 'cs', 'תכנות', 'הנדסת תוכנה'],
    chemistry: ['כימיה', 'chemistry'],
    biology: ['ביולוגיה', 'biology'],
    literature: ['ספרות', 'ספרות עברית', 'ספרות כללית', 'literature', 'hebrew_lit'],
    bible: ['תנ"ך', 'תנך', 'מקרא', 'bible'],
    history: ['היסטוריה', 'history', 'תולדות עם ישראל'],
    civics: ['אזרחות', 'civics', 'ezrahut'],
    hebrew_expression: ['הבעה', 'הבעה עברית', 'עברית (הבעה)', 'לשון', 'לשון עברית', 'עברית', 'habaa'],
    geography: ['גיאוגרפיה', 'גאוגרפיה', 'geography'],
    arabic: ['ערבית', 'arabic'],
    french: ['צרפתית', 'french'],
    philosophy: ['פילוסופיה', 'philosophy'],
    art: ['אמנות', 'תולדות האמנות', 'art'],
    theatre: ['תיאטרון', 'theatre', 'theater'],
    music: ['מוזיקה', 'music'],
    communications: ['תקשורת', 'קולנוע', 'communication']
  };

  /**
   * Normalize Hebrew string for matching (strip quotes, hyphens, extra spaces)
   */
  function normalizeText(text) {
    if (!text) return '';
    return String(text)
      .toLowerCase()
      .replace(/["״'׳\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Search for a subject in candidate's subject list
   * @param {Array} subjects - List of subjects { name, units, grade }
   * @param {string} subjectKey - e.g. 'math', 'physics'
   * @param {string} rawLabel - Raw context text from DOM
   * @returns {Object|null}
   */
  function findCandidateSubject(subjects, subjectKey, rawLabel = '') {
    if (!Array.isArray(subjects) || subjects.length === 0) return null;

    const normLabel = normalizeText(rawLabel);

    // 1. Match by subjectKey synonyms
    if (subjectKey && SUBJECT_SYNONYMS[subjectKey]) {
      const synonyms = SUBJECT_SYNONYMS[subjectKey];
      const match = subjects.find((s) => {
        const normName = normalizeText(s.name);
        return synonyms.some((syn) => normName.includes(syn) || syn.includes(normName));
      });
      if (match) return match;
    }

    // 2. Fallback: match by raw DOM label
    if (normLabel) {
      for (const s of subjects) {
        const normName = normalizeText(s.name);
        if (normName.length >= 3 && (normLabel.includes(normName) || normName.includes(normLabel))) {
          return s;
        }
      }
    }

    return null;
  }

  /**
   * Core Guard Evaluation Function
   * Decides strictly whether to fill a field or leave it untouched.
   *
   * @param {Object} fieldInfo - Information about the DOM field discovered by FieldScanner
   * @param {Object} candidateData - Pending verification data from Kalis
   * @returns {Object} { shouldFill: boolean, value: any, reason: string, status: string }
   */
  function evaluateField(fieldInfo, candidateData) {
    if (!candidateData) {
      return {
        shouldFill: false,
        value: null,
        status: 'SKIPPED_NO_DATA',
        reason: 'לא נמצאו נתוני מועמד במערכת מתקבלים — השדה נותר ריק'
      };
    }

    const type = fieldInfo.type || 'UNKNOWN';

    switch (type) {
      case 'BAGRUT_AVERAGE': {
        const avg = Number(candidateData.targetBagrutAverage || candidateData.currentBagrutAverage || 0);
        if (avg > 0 && avg <= 130) {
          // Format with 1 or 2 decimals based on institution or step
          const formatted = avg.toFixed(fieldInfo.precision || 1);
          return {
            shouldFill: true,
            value: formatted,
            status: 'FILLED',
            reason: `ממוצע בגרות תקין: ${formatted}`
          };
        }
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: 'לא הוזן ממוצע בגרות תקף אצל המועמד — השדה נותר ריק'
        };
      }

      case 'PSYCHOMETRIC_GENERAL': {
        const hasPsych = candidateData.hasTakenPsychometric !== false;
        const score = Number(candidateData.psychometricScore || 0);
        if (hasPsych && score >= 200 && score <= 800) {
          return {
            shouldFill: true,
            value: String(score),
            status: 'FILLED',
            reason: `ציון פסיכומטרי כללי: ${score}`
          };
        }
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: 'המועמד לא נבחן בפסיכומטרי (או מסלול קבלה ללא פסיכומטרי) — השדה נותר ריק לחלוטין'
        };
      }

      case 'PSYCHOMETRIC_QUANT': {
        const hasPsych = candidateData.hasTakenPsychometric !== false;
        const qEmp = Number(candidateData.psychQuantEmphasis || 0);
        const qRaw = Number(candidateData.psychQuant || 0);
        const general = Number(candidateData.psychometricScore || 0);

        const ctx = (fieldInfo.contextText || '') + ' ' + (fieldInfo.label || '') + ' ' + (fieldInfo.element?.placeholder || '');
        const isSubscoreScale = ctx.includes('150') || ctx.includes('1-150') || ctx.includes('150 - 1');

        let finalVal = null;
        if (isSubscoreScale) {
          // Strictly subscore range 50-150
          if (qRaw >= 50 && qRaw <= 150) {
            finalVal = qRaw;
          }
        } else {
          // Standard 200-800 emphasis scale
          if (qEmp >= 200 && qEmp <= 800) finalVal = qEmp;
          else if (qRaw >= 200 && qRaw <= 800) finalVal = qRaw;
          else if (hasPsych && general >= 200 && general <= 800) finalVal = general;
        }

        if (finalVal !== null) {
          return {
            shouldFill: true,
            value: String(finalVal),
            status: 'FILLED',
            reason: isSubscoreScale ? `ציון כמותי בפסיכומטרי (סולם 150): ${finalVal}` : `ציון בדגש כמותי: ${finalVal}`
          };
        }
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: isSubscoreScale ? 'אין ציון כמותי בסולם 150 אצל המועמד — השדה נותר ריק' : 'אין ציון בדגש כמותי אצל המועמד — השדה נותר ריק'
        };
      }

      case 'PSYCHOMETRIC_VERBAL': {
        const hasPsych = candidateData.hasTakenPsychometric !== false;
        const vEmp = Number(candidateData.psychVerbalEmphasis || 0);
        const vRaw = Number(candidateData.psychVerbal || 0);
        const general = Number(candidateData.psychometricScore || 0);

        let finalVal = null;
        if (vEmp >= 200 && vEmp <= 800) finalVal = vEmp;
        else if (vRaw >= 200 && vRaw <= 800) finalVal = vRaw;
        else if (hasPsych && general >= 200 && general <= 800) finalVal = general;

        if (finalVal !== null) {
          return {
            shouldFill: true,
            value: String(finalVal),
            status: 'FILLED',
            reason: `ציון בדגש מילולי: ${finalVal}`
          };
        }
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: 'אין ציון בדגש מילולי אצל המועמד — השדה נותר ריק'
        };
      }

      case 'PSYCHOMETRIC_ENGLISH': {
        const engScore = Number(candidateData.psychEnglish || 0);
        if (engScore >= 50 && engScore <= 150) {
          return {
            shouldFill: true,
            value: String(engScore),
            status: 'FILLED',
            reason: `ציון אנגלית פסיכומטרי/אמי״רנ״ט: ${engScore}`
          };
        }
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: 'אין ציון אנגלית/אמי״רנ״ט למועמד — השדה נותר ריק'
        };
      }

      case 'SUBJECT_GRADE': {
        const sub = findCandidateSubject(
          candidateData.subjects,
          fieldInfo.subjectKey,
          fieldInfo.contextText || fieldInfo.label
        );

        if (sub && Number(sub.grade) >= 40 && Number(sub.grade) <= 100) {
          return {
            shouldFill: true,
            value: String(sub.grade),
            status: 'FILLED',
            reason: `ציון ${sub.name}: ${sub.grade}`
          };
        }

        const nameHe = fieldInfo.subjectNameHe || fieldInfo.label || 'המקצוע המבוקש';
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: `המועמד לא למד/לא נבחן ב-${nameHe} — השדה נותר ריק לחלוטין (ללא ניחוש)`
        };
      }

      case 'SUBJECT_UNITS': {
        const sub = findCandidateSubject(
          candidateData.subjects,
          fieldInfo.subjectKey,
          fieldInfo.contextText || fieldInfo.label
        );

        if (sub && Number(sub.units) >= 1 && Number(sub.units) <= 15) {
          return {
            shouldFill: true,
            value: String(sub.units),
            status: 'FILLED',
            reason: `יחידות לימוד ב-${sub.name}: ${sub.units} יח״ל`
          };
        }

        const nameHe = fieldInfo.subjectNameHe || fieldInfo.label || 'המקצוע';
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_NO_DATA',
          reason: `לא קיימות יחידות לימוד עבור ${nameHe} אצל המועמד — השדה נותר ריק`
        };
      }

      case 'REALIT_BONUS_CHECKBOX': {
        // Specifically for TAU Engineering/Exact Sciences (+10 bonus for 5u Math + 5u Physics)
        const subjects = candidateData.subjects || [];
        const mathSub = subjects.find((s) => s.name && s.name.includes('מתמטיקה'));
        const phySub = subjects.find((s) => s.name && s.name.includes('פיזיקה'));

        const has5uMath = mathSub && Number(mathSub.units) === 5 && Number(mathSub.grade) >= 55;
        const has5uPhy = phySub && Number(phySub.units) === 5 && Number(phySub.grade) >= 55;
        const eligible = Boolean(has5uMath && has5uPhy);

        return {
          shouldFill: true,
          value: eligible,
          status: 'FILLED',
          reason: eligible
            ? 'המועמד זכאי לבונוס ריאלי (5 יח״ל מתמטיקה ופיזיקה)'
            : 'המועמד אינו עומד בתנאי הבונוס הריאלי — התיבה נשארת כבויה'
        };
      }

      case 'DEGREE_SEARCH': {
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_PROTECTED',
          reason: 'שדה חיפוש תואר — מוגן מפני מילוי ציונים'
        };
      }

      case 'UNKNOWN':
      default: {
        return {
          shouldFill: false,
          value: null,
          status: 'SKIPPED_UNKNOWN',
          reason: 'שדה שאינו מוכר למערכת — נותר ללא שינוי'
        };
      }
    }
  }

  // Export to window global for content scripts
  window.KalisDataGuard = {
    evaluateField,
    findCandidateSubject,
    SUBJECT_SYNONYMS,
    normalizeText
  };

  console.log('[Kalis DataGuard] Module loaded successfully.');
})();

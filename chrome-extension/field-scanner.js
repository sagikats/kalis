// Kalis Dynamic Field Scanner (Manifest V3)
// Scans the active page DOM on any university portal, identifying academic admission fields
// and strictly protecting degree search inputs and non-academic fields.

(function () {
  'use strict';

  // Canonical subject matching keywords
  const SUBJECT_DETECTION = [
    { key: 'math', he: 'מתמטיקה', terms: ['מתמטיקה', 'מתמטי', 'math'] },
    { key: 'physics', he: 'פיזיקה', terms: ['פיזיקה', 'פיסיקה', 'physics'] },
    { key: 'english', he: 'אנגלית', terms: ['אנגלית', 'english'] },
    { key: 'cs', he: 'מדעי המחשב', terms: ['מדעי המחשב', 'מדמ״ח', 'מדמח', 'computer science', 'תכנות'] },
    { key: 'chemistry', he: 'כימיה', terms: ['כימיה', 'chemistry'] },
    { key: 'biology', he: 'ביולוגיה', terms: ['ביולוגיה', 'biology'] },
    { key: 'literature', he: 'ספרות', terms: ['ספרות', 'ספרות עברית', 'literature'] },
    { key: 'bible', he: 'תנ״ך', terms: ['תנ"ך', 'תנך', 'מקרא', 'bible'] },
    { key: 'history', he: 'היסטוריה', terms: ['היסטוריה', 'history'] },
    { key: 'civics', he: 'אזרחות', terms: ['אזרחות', 'civics'] },
    { key: 'geography', he: 'גיאוגרפיה', terms: ['גיאוגרפיה', 'גאוגרפיה', 'geography'] }
  ];

  /**
   * Check if an element is a degree search input (MUST NOT be filled with scores!)
   */
  function isDegreeSearchInput(el) {
    if (!el) return false;
    const ph = (el.placeholder || '').toLowerCase();
    const cls = (el.className || '').toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();

    // Explicit degree search indicators
    if (
      cls.includes('search-bar') ||
      cls.includes('deg-search') ||
      cls.includes('program-search') ||
      ph === 'חוג' ||
      ph.includes('חוג') ||
      ph.includes('תואר') ||
      ph.includes('שם חוג') ||
      ph.includes('תוכנית') ||
      ph.includes('program') ||
      ph.includes('major') ||
      name.includes('program') ||
      name.includes('faculty') ||
      id.includes('program') ||
      id.includes('faculty') ||
      aria.includes('חוג') ||
      aria.includes('תואר')
    ) {
      return true;
    }

    // Inside navigation or search container
    if (el.closest('#admission-nav, #admission-nav-container, .search-results-courses-wrapper, .site-header, header')) {
      return true;
    }

    return false;
  }

  /**
   * Check if an element is inside any Kalis extension UI
   */
  function isKalisElement(el) {
    if (!el) return false;
    return Boolean(
      el.closest('#kalis-action-dock, #kalis-floating-companion, #kalis-autofill-banner, #kalis-banner-tau, #kalis-banner-status')
    );
  }

  /**
   * Aggregate surrounding context text for an element
   */
  function getElementContext(el) {
    if (!el) return '';
    const parts = [
      el.id || '',
      el.name || '',
      el.placeholder || '',
      el.title || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('data-field') || '',
      el.getAttribute('data-qa') || ''
    ];

    // Label via for="id"
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) parts.push(lbl.textContent || '');
    }

    // Closest label parent
    const parentLabel = el.closest('label');
    if (parentLabel) parts.push(parentLabel.textContent || '');

    // Siblings
    if (el.previousElementSibling) parts.push(el.previousElementSibling.textContent || '');
    if (el.nextElementSibling) parts.push(el.nextElementSibling.textContent || '');

    // Form-group or table cell container
    const container = el.closest('.form-group, .field, .input-row, .field-wrapper, td, th, tr, li, [class*="form-item"]');
    if (container) parts.push(container.textContent || '');

    return parts.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Determine semantic field type and associated subject from context
   */
  function classifyField(el) {
    if (isKalisElement(el)) return null;

    // Check if degree search
    if (isDegreeSearchInput(el)) {
      return {
        element: el,
        type: 'DEGREE_SEARCH',
        label: 'חיפוש חוג / תואר',
        contextText: getElementContext(el),
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: el.type === 'checkbox'
      };
    }

    const type = (el.getAttribute('type') || '').toLowerCase();
    // Exclude security / non-academic inputs
    if (['password', 'hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(type)) {
      return null;
    }

    const context = getElementContext(el);

    // Skip personal contact / credentials
    if (
      context.includes('סיסמה') ||
      context.includes('password') ||
      context.includes('טלפון') ||
      context.includes('phone') ||
      context.includes('דוא"ל') ||
      context.includes('email') ||
      context.includes('ת.ז') ||
      context.includes('תעודת זהות') ||
      context.includes('passport') ||
      context.includes('captcha') ||
      context.includes('csrf')
    ) {
      return null;
    }

    // 1. TAU Realit Bonus Checkbox
    if (el.type === 'checkbox') {
      if (
        context.includes('ריאלי') ||
        context.includes('בונוס הנדסה') ||
        context.includes('מתמטיקה ופיזיקה') ||
        context.includes('פיזיקה 5')
      ) {
        return {
          element: el,
          type: 'REALIT_BONUS_CHECKBOX',
          label: 'בונוס ריאלי (5 יח״ל פיזיקה ומתמטיקה)',
          contextText: context,
          isSelect: false,
          isCheckbox: true
        };
      }
      return null;
    }

    // 2. Bagrut Average Field
    if (
      (context.includes('ממוצע') && (context.includes('בגרות') || context.includes('משוקלל') || context.includes('מותאם') || context.includes('חישבתי') || context.includes('bagrut'))) ||
      context.includes('bagrut average') ||
      context.includes('bagrut_avg') ||
      context.includes('final_bagrut') ||
      context.includes('ציון מותאם') ||
      (context.includes('ממוצע') && !context.includes('תואר') && !context.includes('פסיכומטרי'))
    ) {
      return {
        element: el,
        type: 'BAGRUT_AVERAGE',
        label: 'ממוצע בגרות',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // 3. Quantitative Emphasis (דגש כמותי)
    if (
      context.includes('דגש כמותי') ||
      (context.includes('כמותי') && context.includes('פסיכומטרי')) ||
      context.includes('quantitative') ||
      context.includes('quant_emphasis')
    ) {
      return {
        element: el,
        type: 'PSYCHOMETRIC_QUANT',
        label: 'פסיכומטרי בדגש כמותי',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // 4. Verbal Emphasis (דגש מילולי)
    if (
      context.includes('דגש מילולי') ||
      (context.includes('מילולי') && context.includes('פסיכומטרי')) ||
      context.includes('verbal') ||
      context.includes('verbal_emphasis')
    ) {
      return {
        element: el,
        type: 'PSYCHOMETRIC_VERBAL',
        label: 'פסיכומטרי בדגש מילולי',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // 5. English Psychometric / AmirNet
    if (
      context.includes('אמי״ר') ||
      context.includes('אמירם') ||
      context.includes('אמירנ״ט') ||
      context.includes('amirnet') ||
      (context.includes('אנגלית') && (context.includes('פסיכומטרי') || context.includes('רמת אנגלית') || context.includes('פטור')))
    ) {
      return {
        element: el,
        type: 'PSYCHOMETRIC_ENGLISH',
        label: 'ציון אנגלית / אמי״רנ״ט',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // 6. General / Multi-Domain Psychometric
    if (
      context.includes('רב תחומי') ||
      context.includes('רב-תחומי') ||
      context.includes('פסיכומטרי כללי') ||
      context.includes('ציון פסיכומטרי') ||
      context.includes('psychometric') ||
      (context.includes('פסיכומטרי') && !context.includes('כמותי') && !context.includes('מילולי') && !context.includes('אנגלית'))
    ) {
      return {
        element: el,
        type: 'PSYCHOMETRIC_GENERAL',
        label: 'פסיכומטרי כללי / רב-תחומי',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // 7. Check for specific subject units or grades
    for (const subj of SUBJECT_DETECTION) {
      const hasSubject = subj.terms.some((term) => context.includes(term));
      if (hasSubject) {
        const isUnits =
          context.includes('יחידות') ||
          context.includes('יח״ל') ||
          context.includes('רמה') ||
          context.includes('level') ||
          context.includes('units') ||
          (el instanceof HTMLSelectElement && Array.from(el.options).some((o) => ['3', '4', '5'].includes(o.value.trim())));

        const isGrade =
          context.includes('ציון') ||
          context.includes('grade') ||
          context.includes('score') ||
          (!isUnits && (type === 'number' || type === 'text'));

        if (isUnits) {
          return {
            element: el,
            type: 'SUBJECT_UNITS',
            subjectKey: subj.key,
            subjectNameHe: subj.he,
            label: `יחידות ${subj.he}`,
            contextText: context,
            isSelect: el instanceof HTMLSelectElement,
            isCheckbox: false
          };
        }

        if (isGrade) {
          return {
            element: el,
            type: 'SUBJECT_GRADE',
            subjectKey: subj.key,
            subjectNameHe: subj.he,
            label: `ציון בגרות ב-${subj.he}`,
            contextText: context,
            isSelect: el instanceof HTMLSelectElement,
            isCheckbox: false
          };
        }
      }
    }

    // 8. Standalone grade or units inputs inside subject tables/rows
    if (context.includes('יחידות') || context.includes('יח״ל') || context.includes('units')) {
      return {
        element: el,
        type: 'SUBJECT_UNITS',
        label: 'יחידות לימוד',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    if (context.includes('ציון') || context.includes('grade')) {
      return {
        element: el,
        type: 'SUBJECT_GRADE',
        label: 'ציון במקצוע',
        contextText: context,
        isSelect: el instanceof HTMLSelectElement,
        isCheckbox: false
      };
    }

    // Fallback: Unknown field
    return {
      element: el,
      type: 'UNKNOWN',
      label: el.name || el.id || el.placeholder || 'שדה לא מוכר',
      contextText: context,
      isSelect: el instanceof HTMLSelectElement,
      isCheckbox: false
    };
  }

  /**
   * Scan entire page and categorize all fields
   * @param {Document|HTMLElement} root - Scanning root
   */
  function scan(root = document) {
    const rawElements = Array.from(
      root.querySelectorAll('input, select, textarea')
    ).filter((el) => !isKalisElement(el));

    const matchedFields = [];
    const unknownFields = [];
    let degreeSearchInput = null;

    rawElements.forEach((el) => {
      const classified = classifyField(el);
      if (!classified) return;

      if (classified.type === 'DEGREE_SEARCH') {
        if (!degreeSearchInput) degreeSearchInput = el;
        return;
      }

      if (classified.type === 'UNKNOWN') {
        unknownFields.push(classified);
      } else {
        matchedFields.push(classified);
      }
    });

    // Deduplicate fields (keep single reference per element)
    const seen = new Set();
    const uniqueMatched = matchedFields.filter((f) => {
      if (seen.has(f.element)) return false;
      seen.add(f.element);
      return true;
    });

    // Detect calculate / submit button on page
    const calculateButton = findCalculateButton(root);

    return {
      fields: uniqueMatched,
      unknownFields,
      degreeSearchInput,
      calculateButton,
      stats: {
        totalInputs: rawElements.length,
        recognizedCount: uniqueMatched.length,
        unknownCount: unknownFields.length,
        hasDegreeSearch: Boolean(degreeSearchInput),
        hasCalculateButton: Boolean(calculateButton)
      }
    };
  }

  /**
   * Find the university calculator's check/calculate button
   */
  function findCalculateButton(root = document) {
    const candidates = Array.from(
      root.querySelectorAll('button, input[type="submit"], [role="button"], a.btn, a.button, div.btn')
    ).filter((b) => !isKalisElement(b));

    const triggerKeywords = [
      'בדוק סיכויי קבלה',
      'בדיקת סיכויי קבלה',
      'לבדיקת סיכויים',
      'בדוק קבלה',
      'חשב סכם',
      'חישוב סכם',
      'חשב',
      'בדוק',
      'ודרישות נוספות',
      'סיכויי קבלה לכל'
    ];

    for (const b of candidates) {
      const text = (b.textContent || b.value || '').trim();
      if (triggerKeywords.some((kw) => text.includes(kw))) {
        return b;
      }
    }

    return null;
  }

  // Export to window global
  window.KalisFieldScanner = {
    scan,
    classifyField,
    isDegreeSearchInput,
    isKalisElement,
    findCalculateButton,
    SUBJECT_DETECTION
  };

  console.log('[Kalis FieldScanner] Module loaded successfully.');
})();

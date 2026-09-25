// Kalis Content Script: Hebrew University of Jerusalem (HUJI) AutoFill
// Target: go.huji.ac.il/* and *.huji.ac.il/*

(async function () {
  console.log('[Kalis HUJI] Script initialized on:', window.location.href, 'Frame:', window.self === window.top ? 'top' : 'iframe');

  // 1. Fetch pending verification data
  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis HUJI] Storage error:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  const isTopWindow = window.self === window.top;
  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const psychScore = pendingVerification.psychometricScore || 0;
  const psychQuant = pendingVerification.psychQuant;
  const psychVerbal = pendingVerification.psychVerbal;
  const psychEnglish = pendingVerification.psychEnglish;
  const subjects = pendingVerification.subjects || [];
  const programName = pendingVerification.programName || '';

  // 2. Banner Notification (Top window)
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
        if (b && b.parentNode) {
          b.style.opacity = '0';
          b.style.transition = 'opacity 0.6s ease';
          setTimeout(() => b.remove(), 600);
        }
      }, 7000);
    }
  };

  showBanner('מתקבלים // האוניברסיטה העברית', programName ? `מחפש תואר: ${programName} ומזין נתוני קבלה...` : 'מזין נתוני בגרות ופסיכומטרי אוטומטית...', false);

  // 3. React/Vue/Native input setter
  const setInputValue = (inp, val) => {
    if (!inp || val === undefined || val === null) return false;
    try {
      inp.focus();
      const proto = window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(inp, val);
      } else {
        inp.value = val;
      }
      inp.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      inp.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      inp.style.backgroundColor = '#EBF4EE';
      inp.style.borderColor = '#22C55E';
      return true;
    } catch (e) {
      console.warn('[Kalis HUJI] Error setting input value:', e);
      return false;
    }
  };

  // Helper to detect if an input is the degree search bar (NOT a grade field!)
  const isDegreeSearchInput = (inp) => {
    if (!inp) return false;
    const ph = (inp.placeholder || '').toLowerCase();
    const cls = (inp.className || '').toLowerCase();
    const type = (inp.getAttribute('type') || '').toLowerCase();
    return (
      cls.includes('search-bar') ||
      ph === 'חוג' ||
      ph === 'program' ||
      ph.includes('חוג') ||
      type === 'search' ||
      inp.id === 'search' ||
      Boolean(inp.closest('#admission-nav, #admission-nav-container, .search-results-courses-wrapper'))
    );
  };

  const getContext = (inp) => {
    const parent = inp.closest('.form-group, .field, .floating-label, tr, label') || inp.parentElement;
    const labelFor = inp.id ? document.querySelector(`label[for="${inp.id}"]`) : null;
    const prevSibling = inp.previousElementSibling ? inp.previousElementSibling.textContent : '';
    const nextSibling = inp.nextElementSibling ? inp.nextElementSibling.textContent : '';
    return (
      (inp.name || '') + ' ' +
      (inp.id || '') + ' ' +
      (inp.placeholder || '') + ' ' +
      (inp.getAttribute('aria-label') || '') + ' ' +
      (labelFor ? labelFor.textContent : '') + ' ' +
      prevSibling + ' ' +
      nextSibling + ' ' +
      (parent ? parent.textContent : '')
    ).toLowerCase();
  };

  // Direct Vuex store sync in page context
  const injectVueStoreUpdate = () => {
    try {
      const qVal = (psychQuant && Number(psychQuant) >= 200) ? Number(psychQuant) : psychScore;
      const vVal = (psychVerbal && Number(psychVerbal) >= 200) ? Number(psychVerbal) : psychScore;
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          try {
            const root = document.querySelector('#app') || document.querySelector('.main-container') || document.body;
            let store = null;
            if (root && root.__vue__ && root.__vue__.$store) {
              store = root.__vue__.$store;
            } else if (window.__store__) {
              store = window.__store__;
            } else {
              const all = document.querySelectorAll('*');
              for (let i = 0; i < Math.min(all.length, 100); i++) {
                if (all[i].__vue__ && all[i].__vue__.$store) {
                  store = all[i].__vue__.$store;
                  break;
                }
              }
            }
            if (store) {
              console.log('[Kalis HUJI Page Context] Found Vuex store, committing state...');
              if (${targetBagrut} > 0) {
                store.commit('setGradeByKey', { key: 'bagrut', value: '${targetBagrut.toFixed(1)}' });
              }
              if (${psychScore} > 0) {
                store.commit('setGradePetByKey', { key: 'multi', value: '${psychScore}' });
                store.commit('setGradePetByKey', { key: 'quantity', value: '${qVal}' });
                store.commit('setGradePetByKey', { key: 'verbal', value: '${vVal}' });
              }
              console.log('[Kalis HUJI Page Context] State committed successfully:', store.state?.grades);
            }
          } catch(e) {
            console.warn('[Kalis HUJI Page Context] Injection error:', e);
          }
        })();
      `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (e) {
      console.warn('[Kalis HUJI] Failed to inject Vuex store update:', e);
    }
  };

  // Helper to open the admission calculator modal if not already open
  const openAdmissionCalculator = () => {
    if (document.querySelector('#admission-check')) return true;

    console.log('[Kalis HUJI] Opening admission calculator modal...');
    const openBtn = document.querySelector('#admission-all-btn') || 
      Array.from(document.querySelectorAll('a, button, div, span')).find(el => {
        const t = (el.textContent || '').trim();
        return t.includes('בדיקת סיכויי הקבלה לכל החוגים') || t.includes('מחשבון קבלה לכל החוגים');
      });

    if (openBtn && typeof openBtn.click === 'function') {
      openBtn.click();
    }

    try {
      const s = document.createElement('script');
      s.textContent = `
        (function() {
          try {
            const root = document.querySelector('#app') || document.body;
            const store = root.__vue__?.$store || window.__store__;
            if (store) {
              store.commit('setCheckAdmission', true);
              store.commit('setAdmissionAll', true);
            }
          } catch(e) {}
        })();
      `;
      (document.head || document.documentElement).appendChild(s);
      s.remove();
    } catch(e) {}

    return Boolean(document.querySelector('#admission-check'));
  };

  // 4. Polling fill engine (up to 5 seconds)
  let attempts = 0;
  const maxAttempts = 25;
  let hasFilled = false;
  let hasTypedProgram = false;

  const tryFillHuji = () => {
    if (hasFilled) return;
    attempts++;

    // Step A: Check if degree search bar is present on screen
    const searchBar = document.querySelector('input.search-bar') ||
      Array.from(document.querySelectorAll('input')).find(isDegreeSearchInput);

    if (searchBar && programName && !hasTypedProgram && searchBar.value !== programName) {
      hasTypedProgram = true;
      console.log('[Kalis HUJI] Typing programName into degree search bar:', programName);
      setInputValue(searchBar, programName);
      searchBar.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      searchBar.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // Wait for matching degree in search results and click it
      setTimeout(() => {
        const results = Array.from(document.querySelectorAll('.search-results a, .search-results div, .search-results .result, a[href*="programAdmission"]'));
        const match = results.find(r => (r.textContent || '').includes(programName)) || results[0];
        if (match && typeof match.click === 'function') {
          console.log('[Kalis HUJI] Clicking matching degree result:', match.textContent);
          match.click();
        }
      }, 500);
    }

    // Step B: Ensure the admission calculator modal is open
    const isModalOpen = Boolean(document.querySelector('#admission-check'));
    if (!isModalOpen) {
      openAdmissionCalculator();
    }

    // Step C: Look for grade inputs (strictly EXCLUDE degree search bar!)
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'))
      .filter(inp => !isDegreeSearchInput(inp));

    if (allInputs.length === 0) {
      if (attempts < maxAttempts) setTimeout(tryFillHuji, 200);
      return;
    }

    const qVal = (psychQuant && Number(psychQuant) >= 200) ? Number(psychQuant) : psychScore;
    const vVal = (psychVerbal && Number(psychVerbal) >= 200) ? Number(psychVerbal) : psychScore;

    let bagrutInp = null;
    let multiInp = null;
    let quantInp = null;
    let verbalInp = null;
    let filledCount = 0;
    let psychFilledCount = 0;

    allInputs.forEach((inp) => {
      const txt = getContext(inp);
      if (txt.includes('search') || txt.includes('חיפוש') || txt.includes('סיסמה') || txt.includes('email') || txt.includes('טלפון')) return;

      // 1. Bagrut average
      if (!bagrutInp && targetBagrut > 0) {
        if (
          (txt.includes('ממוצע') && txt.includes('בגרות')) ||
          txt.includes('מותאם') ||
          txt.includes('bagrut') ||
          (txt.includes('ממוצע') && !txt.includes('תואר') && !txt.includes('מכינה'))
        ) {
          bagrutInp = inp;
          if (setInputValue(inp, targetBagrut.toFixed(1))) filledCount++;
          return;
        }
      }

      // 2. HUJI Multi-domain / General emphasis (בדגש רב תחומי)
      if (!multiInp && psychScore > 0) {
        if (
          txt.includes('רב תחומי') ||
          txt.includes('רב-תחומי') ||
          txt.includes('general emphasis') ||
          txt.includes('בדגש רב') ||
          txt.includes('multi')
        ) {
          multiInp = inp;
          if (setInputValue(inp, psychScore)) {
            filledCount++;
            psychFilledCount++;
          }
          return;
        }
      }

      // 3. HUJI Quantitative emphasis (דגש כמותי)
      if (!quantInp && psychScore > 0) {
        if (
          txt.includes('דגש כמותי') ||
          txt.includes('כמותי') ||
          txt.includes('quantitative') ||
          txt.includes('quantity')
        ) {
          quantInp = inp;
          if (setInputValue(inp, qVal)) {
            filledCount++;
            psychFilledCount++;
          }
          return;
        }
      }

      // 4. HUJI Verbal emphasis (בדגש מילולי)
      if (!verbalInp && psychScore > 0) {
        if (
          txt.includes('בדגש מילולי') ||
          txt.includes('מילולי') ||
          txt.includes('verbal')
        ) {
          verbalInp = inp;
          if (setInputValue(inp, vVal)) {
            filledCount++;
            psychFilledCount++;
          }
          return;
        }
      }
    });

    // 5. Positional fallback for the 3 psychometric inputs if individual labels were missed
    if (psychScore > 0 && psychFilledCount === 0) {
      const psychContainers = Array.from(document.querySelectorAll('div, section, form, [class*="container"]')).filter(el => {
        const t = (el.textContent || '').toLowerCase();
        return (t.includes('שלושת הציונים') || (t.includes('פסיכומטרי') && t.includes('דגש')) || t.includes('רב תחומי')) && !el.closest('#admission-nav');
      });

      for (const container of psychContainers) {
        const containerInputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'))
          .filter(inp => inp !== bagrutInp && !isDegreeSearchInput(inp));
        if (containerInputs.length === 3) {
          console.log('[Kalis HUJI] Found 3 psychometric inputs via positional container:', containerInputs);
          containerInputs.forEach((inp) => {
            const cTxt = getContext(inp);
            if (cTxt.includes('כמותי')) {
              setInputValue(inp, qVal);
            } else if (cTxt.includes('מילולי')) {
              setInputValue(inp, vVal);
            } else if (cTxt.includes('רב')) {
              setInputValue(inp, psychScore);
            } else {
              setInputValue(inp, psychScore);
            }
            filledCount++;
            psychFilledCount++;
          });
          break;
        }
      }
    }

    const bagrutDone = targetBagrut > 0 ? (bagrutInp !== null) : true;
    const psychDone = psychScore > 0 ? (psychFilledCount > 0) : true;

    if ((bagrutDone && psychDone) || (attempts >= maxAttempts && filledCount > 0)) {
      hasFilled = true;
      console.log('[Kalis HUJI] Auto-filled successfully: bagrut + psychometric (', filledCount, 'fields, psych:', psychFilledCount, ')');

      // Inject direct Vuex store update for guaranteed reactivity
      injectVueStoreUpdate();

      showBanner(
        '✓ הוזנו נתונים בהצלחה!',
        `ממוצע בגרות ${targetBagrut > 0 ? targetBagrut.toFixed(1) : ''} • פסיכומטרי ${psychScore} (3 דגשים) • בודק קבלה...`,
        true
      );

      // Trigger Calculate / Check Button
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], [role="button"], div, span'));
        const calcBtn = buttons.find((b) => {
          const t = (b.textContent || b.value || '').trim();
          return (
            (
              t.includes('לבדיקת סיכויי קבלה') ||
              t.includes('ודרישות נוספות') ||
              t.includes('סיכויי קבלה לכל') ||
              t.includes('לבדיקת סיכויים') ||
              t.includes('בדוק') ||
              t.includes('חשב') ||
              t.includes('חישוב') ||
              t.includes('המשך')
            ) &&
            !b.closest('#kalis-floating-companion') &&
            !b.closest('#kalis-autofill-banner') &&
            !b.closest('#admission-nav-container')
          );
        });

        if (calcBtn && typeof calcBtn.click === 'function') {
          console.log('[Kalis HUJI] Clicking check button:', calcBtn);
          calcBtn.click();
        }
      }, 500);

      return;
    }

    if (attempts < maxAttempts) {
      setTimeout(tryFillHuji, 200);
    }
  };

  // Launch & Dynamic Modal Watcher
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryFillHuji);
  } else {
    tryFillHuji();
  }

  // Watch for dynamic modal insertion / Vue render
  const modalObserver = new MutationObserver(() => {
    if (!hasFilled) {
      tryFillHuji();
    }
  });
  modalObserver.observe(document.body, { childList: true, subtree: true });

  // Listen for clicks on buttons that open the admission modal
  document.addEventListener('click', (e) => {
    const t = (e.target?.textContent || '').trim();
    if (
      t.includes('בדיקת סיכויי קבלה') ||
      t.includes('לכל החוגים') ||
      t.includes('מחשבון קבלה') ||
      e.target?.closest?.('#hamburger, .calc, .help, #admission-all-btn')
    ) {
      hasFilled = false;
      attempts = 0;
      setTimeout(tryFillHuji, 300);
      setTimeout(tryFillHuji, 800);
    }
  }, true);

  // 5. Floating Companion Card
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
      width: 320px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      color: #222222;
    `;

    const targetSekem = pendingVerification.targetSekem ? pendingVerification.targetSekem.toFixed(1) : '-';
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
          <strong style="font-size: 12.5px; color: #111;">סייען מתקבלים — האוניברסיטה העברית</strong>
        </div>
        <button id="kalis-close-widget" style="background: none; border: none; font-size: 15px; cursor: pointer; color: #888; padding: 0 4px;">✕</button>
      </div>

      ${programName ? `
        <div style="background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 210px;">
            <span style="font-size: 10px; color: #666; font-weight: bold;">תואר מבוקש: </span>
            <strong style="font-size: 12px; color: #111;">${programName}</strong>
          </div>
          <button class="kalis-copy-btn" data-val="${programName}" style="background: #FAF8F5; border: 1px solid #DDD7CC; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer; color: #3C3C3C;">העתק</button>
        </div>
      ` : ''}

      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">סכם צפוי</div>
          <div style="font-size: 14px; font-weight: 900; color: #15803d;">${targetSekem}</div>
        </div>
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">פסיכומטרי</div>
          <div style="font-size: 14px; font-weight: 900; color: #222;">${psychScore || 'ללא'}</div>
          ${psychScore ? `<button class="kalis-copy-btn" data-val="${psychScore}" style="margin-top: 2px; background: #FAF8F5; border: 1px solid #DDD7CC; border-radius: 4px; padding: 1px 4px; font-size: 9px; cursor: pointer; color: #3C3C3C;">העתק</button>` : ''}
        </div>
        <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
          <div style="font-size: 9.5px; color: #666; font-weight: bold;">ממוצע בגרות</div>
          <div style="font-size: 14px; font-weight: 900; color: #222;">${targetBagrut ? targetBagrut.toFixed(1) : '-'}</div>
          ${targetBagrut ? `<button class="kalis-copy-btn" data-val="${targetBagrut.toFixed(1)}" style="margin-top: 2px; background: #FAF8F5; border: 1px solid #DDD7CC; border-radius: 4px; padding: 1px 4px; font-size: 9px; cursor: pointer; color: #3C3C3C;">העתק</button>` : ''}
        </div>
      </div>

      <div style="display: flex; gap: 4px; margin-bottom: 8px;">
        <button id="kalis-open-calc-btn" style="flex: 1; background: #3C3C3C; color: white; border: none; border-radius: 8px; padding: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
          📊 מחשבון קבלה (הזן ציונים)
        </button>
        ${programName ? `
          <button id="kalis-search-degree-btn" style="background: white; border: 1px solid #3C3C3C; color: #3C3C3C; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: bold; cursor: pointer; white-space: nowrap;">
            🔍 חפש תואר
          </button>
        ` : ''}
      </div>

      <div style="flex: 1; overflow-y: auto; max-height: 140px; padding-right: 2px;">
        ${subjectsHtml}
      </div>
    `;

    document.body.appendChild(widget);

    document.getElementById('kalis-close-widget')?.addEventListener('click', () => widget.remove());

    document.getElementById('kalis-open-calc-btn')?.addEventListener('click', () => {
      hasFilled = false;
      attempts = 0;
      openAdmissionCalculator();
      setTimeout(tryFillHuji, 300);
    });

    document.getElementById('kalis-search-degree-btn')?.addEventListener('click', () => {
      const sb = document.querySelector('input.search-bar') ||
        Array.from(document.querySelectorAll('input')).find(isDegreeSearchInput);
      if (sb && programName) {
        setInputValue(sb, programName);
        sb.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        sb.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    });

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

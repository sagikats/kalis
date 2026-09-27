// Kalis Content Script: Ben-Gurion University (BGU)
// Target: bgu.ac.il/welcome/ba/calculator/* and apps4cloud.bgu.ac.il/calcprod/*
// Strictly enforces Zero-Guess policy via KalisDataGuard & integrates with KalisDock

(async function () {
  'use strict';
  const isTopWindow = window.self === window.top;
  console.log('[Kalis BGU] Script initialized on:', window.location.href, 'Frame:', isTopWindow ? 'top' : 'iframe');

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis BGU] Storage read error:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const psychScore = pendingVerification.psychometricScore || pendingVerification.psychometricGeneral || 0;
  const subjects = pendingVerification.subjects || pendingVerification.bagrutSubjects || [];

  // Bulletproof React 15-19 / Controlled Input Setter
  const setReactInput = (inp, val) => {
    if (!inp || val === undefined || val === null) return false;
    try {
      try { inp.focus(); } catch (e) {}

      const isCb = inp.type === 'checkbox';
      const isSel = inp instanceof HTMLSelectElement || inp.tagName === 'SELECT';
      const prop = isCb ? 'checked' : 'value';
      const realVal = isCb ? Boolean(val) : String(val);
      let setDone = false;

      try {
        const proto = Object.getPrototypeOf(inp) || (isSel ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype);
        const desc = Object.getOwnPropertyDescriptor(proto, prop) || 
                     Object.getOwnPropertyDescriptor(isSel ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype, prop);
        if (desc && desc.set) {
          desc.set.call(inp, realVal);
          setDone = true;
        }
      } catch (e) {}

      if (!setDone) {
        try {
          if (isCb) inp.checked = realVal;
          else inp.value = realVal;
        } catch (e) {}
      }

      // Reset React 16+ value tracker
      try {
        if (inp._valueTracker && typeof inp._valueTracker.setValue === 'function') {
          inp._valueTracker.setValue(isCb ? !realVal : '');
        }
      } catch (e) {}

      inp.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

      // Directly invoke React synthetic onChange / onInput props if attached
      const reactKey = Object.keys(inp).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
      if (reactKey && inp[reactKey]) {
        const fakeEvt = {
          target: inp,
          currentTarget: inp,
          bubbles: true,
          defaultPrevented: false,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        if (typeof inp[reactKey].onChange === 'function') {
          try { inp[reactKey].onChange(fakeEvt); } catch (e) {}
        }
        if (typeof inp[reactKey].onInput === 'function') {
          try { inp[reactKey].onInput(fakeEvt); } catch (e) {}
        }
      }

      inp.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      inp.style.backgroundColor = '#EBF4EE';
      inp.style.borderColor = '#22C55E';
      inp.style.transition = 'background-color 0.4s ease, border-color 0.4s ease';
      return true;
    } catch (e) {
      console.warn('[Kalis BGU] Error setting input value:', e);
      return false;
    }
  };

  // -------------------------------------------------------------
  // A. IFRAME CONTROLLER (apps4cloud.bgu.ac.il / embedded SPA)
  // -------------------------------------------------------------
  const isBguCalcFrame = window.location.hostname.includes('apps4cloud.bgu.ac.il') || document.querySelector('.bgu-calc, #bgu-test, .cleanslate');

  if (isBguCalcFrame) {
    console.log('[Kalis BGU] Running inside BGU Calculator application Frame.');

    let bagrutStepCompleted = false;
    let mechinaStepCompleted = false;
    let psychStepCompleted = false;

    const fillBguBagrutStep = () => {
      // 1. Ensure we are in "כבר חישבתי ממוצע בגרות" mode
      const hash = window.location.hash || '';
      if (!hash.includes('bagrut-average')) {
        const goToAvgBtn = document.querySelector('.page-link.go-to-average, a[href*="bagrut-average"]') ||
          Array.from(document.querySelectorAll('a, div.page-link, span')).find(el => {
            const t = (el.textContent || '').trim();
            return t.includes('כבר חישבתי') || t.includes('לחישוב ממוצע בגרות');
          });

        if (goToAvgBtn && typeof goToAvgBtn.click === 'function') {
          console.log('[Kalis BGU] Clicking tab to switch to bagrut-average mode...');
          goToAvgBtn.click();
          return;
        } else {
          // Alternatively switch hash directly
          window.location.hash = '#/bagrut-average';
          return;
        }
      }

      // 2. Average input (.my-average input.simple-input)
      const avgInput = document.querySelector('.my-average input.simple-input') || 
                       document.querySelector('.my-average input') ||
                       Array.from(document.querySelectorAll('input.simple-input')).find((i) => {
                         const parentTxt = (i.parentElement?.textContent || '').toLowerCase();
                         return parentTxt.includes('כבר חישבתי') || parentTxt.includes('ממוצע');
                       });

      const avgEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'BAGRUT_AVERAGE', precision: 1 }, pendingVerification)
        : { shouldFill: targetBagrut > 0, value: targetBagrut.toFixed(1) };

      let filledAverage = false;
      if (avgInput && avgEval && avgEval.shouldFill) {
        filledAverage = setReactInput(avgInput, avgEval.value);
        console.log('[Kalis BGU] Filled Bagrut average:', avgEval.value);
      }

      // 3. Math & Physics rows
      const allSimpleInputs = Array.from(document.querySelectorAll('input.simple-input'));
      const mathLevel = document.querySelector('input[id*="0_level"], input[id*="math_level"]') || allSimpleInputs[1];
      const mathGrade = document.querySelector('input[id*="0_grade"], input[id*="math_grade"]') || allSimpleInputs[2];

      const mathGradeEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'SUBJECT_GRADE', subjectKey: 'math', subjectNameHe: 'מתמטיקה' }, pendingVerification)
        : null;
      const mathUnitsEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'SUBJECT_UNITS', subjectKey: 'math', subjectNameHe: 'מתמטיקה' }, pendingVerification)
        : null;

      if (mathUnitsEval && mathUnitsEval.shouldFill && mathLevel) {
        setReactInput(mathLevel, mathUnitsEval.value);
      }
      if (mathGradeEval && mathGradeEval.shouldFill && mathGrade) {
        setReactInput(mathGrade, mathGradeEval.value);
      }

      // Physics: STRICT ZERO GUESS — only fill if candidate has Physics!
      const phyLevel = document.querySelector('input[id*="1_level"], input[id*="phy_level"]') || allSimpleInputs[3];
      const phyGrade = document.querySelector('input[id*="1_grade"], input[id*="phy_grade"]') || allSimpleInputs[4];

      const phyGradeEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'SUBJECT_GRADE', subjectKey: 'physics', subjectNameHe: 'פיזיקה' }, pendingVerification)
        : null;
      const phyUnitsEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'SUBJECT_UNITS', subjectKey: 'physics', subjectNameHe: 'פיזיקה' }, pendingVerification)
        : null;

      if (phyUnitsEval && phyUnitsEval.shouldFill && phyLevel) {
        setReactInput(phyLevel, phyUnitsEval.value);
      }
      if (phyGradeEval && phyGradeEval.shouldFill && phyGrade) {
        setReactInput(phyGrade, phyGradeEval.value);
      }

      if (filledAverage) {
        bagrutStepCompleted = true;
        // Advance to Mechina step
        setTimeout(() => {
          const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                          Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                            const t = (el.textContent || '').trim();
                            return t.includes('הבא') && !el.classList.contains('disabled-action');
                          });
          if (nextBtn) {
            console.log('[Kalis BGU] Advancing to Mechina step:', nextBtn);
            nextBtn.click();
          }
        }, 700);
      }
    };

    const fillBguPsychStep = () => {
      const allInputs = Array.from(document.querySelectorAll('input.simple-input'));
      if (allInputs.length === 0) return;

      console.log('[Kalis BGU] Populating BGU psychometric inputs with candidate data.');

      // BGU inputs in order:
      // [0]: psychometryGeneral (200-800)
      // [1]: quantitativeReasoning (50-150)
      // [2]: verbalReasoning (50-150)
      // [3]: english (50-150)

      let filledGeneral = false;

      // 1. General psychometric
      const generalEval = window.KalisDataGuard
        ? window.KalisDataGuard.evaluateField({ type: 'PSYCHOMETRIC_GENERAL' }, pendingVerification)
        : { shouldFill: psychScore > 0, value: psychScore };

      if (generalEval && generalEval.shouldFill && allInputs[0]) {
        filledGeneral = setReactInput(allInputs[0], generalEval.value);
      }

      // 2. Quantitative subscore (50-150) — STRICT ZERO GUESS: only fill if explicitly provided
      const rawQuant = pendingVerification.psychQuant || pendingVerification.psychometricQuant;
      if (rawQuant && rawQuant >= 50 && rawQuant <= 150 && allInputs[1]) {
        setReactInput(allInputs[1], rawQuant);
      }

      // 3. Verbal subscore (50-150) — STRICT ZERO GUESS: only fill if explicitly provided
      const rawVerbal = pendingVerification.psychVerbal || pendingVerification.psychometricVerbal;
      if (rawVerbal && rawVerbal >= 50 && rawVerbal <= 150 && allInputs[2]) {
        setReactInput(allInputs[2], rawVerbal);
      }

      // 4. English subscore (50-150) — STRICT ZERO GUESS: only fill if explicitly provided
      const rawEng = pendingVerification.psychEnglish || pendingVerification.psychometricEnglish;
      if (rawEng && rawEng >= 50 && rawEng <= 150 && allInputs[3]) {
        setReactInput(allInputs[3], rawEng);
      }

      if (filledGeneral) {
        psychStepCompleted = true;
        console.log('[Kalis BGU] Psychometry filled. Advancing to Total Sekem results...');
        setTimeout(() => {
          const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                          Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                            const t = (el.textContent || '').trim();
                            return t.includes('הבא') && !el.classList.contains('disabled-action');
                          });
          if (nextBtn) nextBtn.click();
        }, 700);
      }
    };

    // Monitor Hash Changes and Polling in BGU SPA
    const checkBguState = () => {
      const hash = window.location.hash || '';

      if (hash.includes('bagrut') || !hash || hash === '#/') {
        if (!bagrutStepCompleted) fillBguBagrutStep();
      } else if (hash.includes('mechina')) {
        if (!mechinaStepCompleted) {
          mechinaStepCompleted = true;
          setTimeout(() => {
            const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                            Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                              const t = (el.textContent || '').trim();
                              return (t.includes('הבא') || t.includes('דלג') || t.includes('דילוג')) && !el.classList.contains('disabled-action');
                            });
            if (nextBtn) {
              console.log('[Kalis BGU] Skipping Mechina step...');
              nextBtn.click();
            }
          }, 400);
        }
      } else if (hash.includes('psychometry')) {
        if (!psychStepCompleted) fillBguPsychStep();
      } else if (hash.includes('total')) {
        // Read calculated Sekem from DOM and report to Top Window Dock
        const allInputs = Array.from(document.querySelectorAll('input.simple-input, .user-field input, .calculator input'));
        const sekemBagrut = allInputs[0]?.value;
        const sekemQuantity = allInputs[1]?.value;
        const bagrutAvg = allInputs[3]?.value;
        if (sekemBagrut || sekemQuantity) {
          window.top?.postMessage({
            type: 'KALIS_INSTITUTION_CALCULATED_RESULTS',
            institutionId: 'bgu',
            sekemBagrut: sekemBagrut || null,
            sekemQuantity: sekemQuantity && sekemQuantity !== '0' ? sekemQuantity : null,
            bagrutAverage: bagrutAvg || null
          }, '*');
        }
      }
    };

    setInterval(checkBguState, 500);

    // Listen for manual trigger from Top Window
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'KALIS_BGU_AUTOFILL') {
        console.log('[Kalis BGU] Received manual trigger from top dock.');
        bagrutStepCompleted = false;
        mechinaStepCompleted = false;
        psychStepCompleted = false;
        checkBguState();
      }
    });
  }

  // -------------------------------------------------------------
  // B. TOP WINDOW CONTROLLER (Banner, Floating Companion & Cross-Frame Sync)
  // -------------------------------------------------------------
  if (isTopWindow) {
    // 1. Show Top Banner
    const banner = document.createElement('div');
    banner.id = 'kalis-autofill-banner';
    banner.style.cssText = `
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
    banner.innerHTML = `
      <div style="width: 32px; height: 32px; background: #3C3C3C; border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; flex-shrink: 0;">
        ✓
      </div>
      <div>
        <div style="font-weight: 800; color: #111;">מתקבלים // בן-גוריון AutoFill</div>
        <div style="font-size: 11.5px; color: #15803d; margin-top: 1px; font-weight: 700;">
          ממוצע בגרות ${targetBagrut.toFixed(1)} • פסיכומטרי ${psychScore} מוזנים אוטומטית במחשבון
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => {
      if (banner && banner.parentNode) {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.6s ease';
        setTimeout(() => banner.remove(), 600);
      }
    }, 7000);

    // 2. Floating Companion Widget with direct "מלא שוב" action
    if (!document.getElementById('kalis-floating-companion')) {
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
        width: 310px;
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
            <strong style="font-size: 12.5px; color: #111;">סייען מתקבלים — בן-גוריון</strong>
          </div>
          <button id="kalis-close-widget" style="background: none; border: none; font-size: 15px; cursor: pointer; color: #888; padding: 0 4px;">✕</button>
        </div>

        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
            <div style="font-size: 9.5px; color: #666; font-weight: bold;">סכם צפוי</div>
            <div style="font-size: 14px; font-weight: 900; color: #15803d;">${targetSekem}</div>
          </div>
          <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
            <div style="font-size: 9.5px; color: #666; font-weight: bold;">פסיכומטרי</div>
            <div style="font-size: 14px; font-weight: 900; color: #222;">${psychScore || 'ללא'}</div>
          </div>
          <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px; text-align: center;">
            <div style="font-size: 9.5px; color: #666; font-weight: bold;">ממוצע בגרות</div>
            <div style="font-size: 14px; font-weight: 900; color: #222;">${targetBagrut ? targetBagrut.toFixed(1) : '-'}</div>
          </div>
        </div>

        <button id="kalis-trigger-bgu-fill" style="
          width: 100%;
          padding: 8px;
          margin-bottom: 8px;
          background: #3C3C3C;
          color: white;
          border: 1px solid #111;
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        ">
          <span>⚡</span>
          <span>מלא נתונים שוב במחשבון</span>
        </button>

        <div style="flex: 1; overflow-y: auto; max-height: 150px; padding-right: 2px;">
          ${subjectsHtml}
        </div>
      `;

      document.body.appendChild(widget);

      document.getElementById('kalis-close-widget')?.addEventListener('click', () => widget.remove());

      document.getElementById('kalis-trigger-bgu-fill')?.addEventListener('click', () => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        iframes.forEach((ifr) => {
          try {
            ifr.contentWindow?.postMessage({ type: 'KALIS_BGU_AUTOFILL', data: pendingVerification }, '*');
          } catch (e) {}
        });
        const btn = document.getElementById('kalis-trigger-bgu-fill');
        if (btn) {
          btn.textContent = '✓ פקודת מילוי נשלחה!';
          btn.style.background = '#15803d';
          setTimeout(() => {
            btn.innerHTML = '<span>⚡</span><span>מלא נתונים שוב במחשבון</span>';
            btn.style.background = '#3C3C3C';
          }, 2500);
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
  }

  console.log('[Kalis BGU] Ready and integrated with KalisDock.');
})();

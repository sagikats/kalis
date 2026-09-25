// Kalis Content Script: Ben-Gurion University (BGU) Calculator AutoFill
// Target: bgu.ac.il/welcome/ba/calculator/* and apps4cloud.bgu.ac.il/calcprod/*

(async function () {
  console.log('[Kalis BGU] Script initialized on:', window.location.href, 'Frame:', window.self === window.top ? 'top' : 'iframe');

  // 1. Fetch pending verification data
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

  const isTopWindow = window.self === window.top;
  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const psychScore = pendingVerification.psychometricScore || 0;
  const psychQuant = pendingVerification.psychQuant;
  const psychVerbal = pendingVerification.psychVerbal;
  const psychEnglish = pendingVerification.psychEnglish;
  const subjects = pendingVerification.subjects || [];

  // Helper for React synthetic state update
  const setReactInput = (inp, val) => {
    if (!inp || val === undefined || val === null) return false;
    try {
      inp.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(inp, val);
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
    let psychStepCompleted = false;

    const fillBguBagrutStep = () => {
      // 1. Average input (.my-average input.simple-input)
      const avgInput = document.querySelector('.my-average input.simple-input') || 
                       document.querySelector('.my-average input') ||
                       Array.from(document.querySelectorAll('input.simple-input')).find(i => {
                         const parentTxt = (i.parentElement?.textContent || '').toLowerCase();
                         return parentTxt.includes('כבר חישבתי') || parentTxt.includes('ממוצע');
                       });

      if (avgInput && targetBagrut > 0) {
        const formatted = targetBagrut.toFixed(1);
        setReactInput(avgInput, formatted);
        console.log('[Kalis BGU] Filled Bagrut average:', formatted);
      }

      // 2. Math & Physics rows
      const mathSub = subjects.find(s => s.name.includes('מתמטיקה'));
      const phySub = subjects.find(s => s.name.includes('פיזיקה'));

      // Find all rows or input wrappers
      const allSimpleInputs = Array.from(document.querySelectorAll('input.simple-input'));
      
      // BGU items have IDs like item_0_level, item_0_grade
      const mathLevel = document.querySelector('input[id*="0_level"], input[id*="math_level"]') || allSimpleInputs[1];
      const mathGrade = document.querySelector('input[id*="0_grade"], input[id*="math_grade"]') || allSimpleInputs[2];
      
      if (mathSub) {
        if (mathLevel) setReactInput(mathLevel, mathSub.units);
        if (mathGrade) setReactInput(mathGrade, mathSub.grade);
        console.log('[Kalis BGU] Filled Math:', mathSub.units, 'units, grade:', mathSub.grade);
      }

      const phyLevel = document.querySelector('input[id*="1_level"], input[id*="phy_level"]') || allSimpleInputs[3];
      const phyGrade = document.querySelector('input[id*="1_grade"], input[id*="phy_grade"]') || allSimpleInputs[4];

      if (phySub) {
        if (phyLevel) setReactInput(phyLevel, phySub.units);
        if (phyGrade) setReactInput(phyGrade, phySub.grade);
        console.log('[Kalis BGU] Filled Physics:', phySub.units, 'units, grade:', phySub.grade);
      }

      bagrutStepCompleted = true;

      // 3. Click the Next button ('הבא >')
      setTimeout(() => {
        const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                        Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                          const t = (el.textContent || '').trim();
                          return t.includes('הבא') && !el.classList.contains('disabled-action');
                        });

        if (nextBtn) {
          console.log('[Kalis BGU] Clicking Next button to Psychometry step:', nextBtn);
          nextBtn.click();
        }
      }, 500);
    };

    const fillBguPsychStep = () => {
      const allInputs = Array.from(document.querySelectorAll('input.simple-input'));
      if (allInputs.length === 0) return;

      console.log('[Kalis BGU] Found psychometry inputs:', allInputs.length);

      // In BGU's Ea component, inputs are ordered:
      // [0]: psychometryGeneral
      // [1]: quantitativeReasoning
      // [2]: verbalReasoning
      // [3]: english
      if (psychScore > 0 && allInputs[0]) {
        setReactInput(allInputs[0], psychScore);
      }

      if (allInputs[1]) {
        const qVal = psychQuant || (psychScore > 0 ? Math.min(150, Math.max(50, Math.round(psychScore / 5.5))) : 125);
        setReactInput(allInputs[1], qVal);
      }

      if (allInputs[2]) {
        const vVal = psychVerbal || (psychScore > 0 ? Math.min(150, Math.max(50, Math.round(psychScore / 5.5))) : 125);
        setReactInput(allInputs[2], vVal);
      }

      if (allInputs[3]) {
        const eVal = psychEnglish || (psychScore > 0 ? Math.min(150, Math.max(50, Math.round(psychScore / 5.5))) : 125);
        setReactInput(allInputs[3], eVal);
      }

      psychStepCompleted = true;
      console.log('[Kalis BGU] Psychometry inputs populated. Advancing to total results...');

      setTimeout(() => {
        const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                        Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                          const t = (el.textContent || '').trim();
                          return t.includes('הבא') && !el.classList.contains('disabled-action');
                        });
        if (nextBtn) {
          console.log('[Kalis BGU] Clicking next to Total Sekem:', nextBtn);
          nextBtn.click();
        }
      }, 500);
    };

    // Monitor Hash Changes and Polling in BGU SPA
    const checkBguState = () => {
      const hash = window.location.hash || '';

      if (hash.includes('bagrut') || !hash || hash === '#/') {
        if (!bagrutStepCompleted) fillBguBagrutStep();
      } else if (hash.includes('mechina')) {
        // Auto-advance / skip mechina
        const nextBtn = document.querySelector('.bottom-navigation .next-link, a.next-link, .next-link.open-link') ||
                        Array.from(document.querySelectorAll('a, button, div.page-link')).find(el => {
                          const t = (el.textContent || '').trim();
                          return (t.includes('הבא') || t.includes('דלג') || t.includes('דילוג')) && !el.classList.contains('disabled-action');
                        });
        if (nextBtn) nextBtn.click();
      } else if (hash.includes('psychometry')) {
        if (!psychStepCompleted) fillBguPsychStep();
      }
    };

    // Poll for inputs during transitions
    setInterval(checkBguState, 400);
  }

  // -------------------------------------------------------------
  // B. TOP WINDOW CONTROLLER (Banner & Floating Companion)
  // -------------------------------------------------------------
  if (isTopWindow) {
    // Show Top Banner
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

    // Floating Companion Widget
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

        <div style="flex: 1; overflow-y: auto; max-height: 150px; padding-right: 2px;">
          ${subjectsHtml}
        </div>
      `;

      document.body.appendChild(widget);

      document.getElementById('kalis-close-widget')?.addEventListener('click', () => widget.remove());

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
})();

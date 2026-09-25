// Kalis Content Script: General Universities Companion & AutoFill
// Target: HUJI, BGU, BIU, Haifa, Ariel, Reichman

(async function () {
  console.log('[Kalis Extension] General university companion active. Frame:', window.self === window.top ? 'top' : 'iframe');

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis Extension] Error reading storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  const isTopWindow = window.self === window.top;
  if (!isTopWindow) return; // Only show floating companion on top window

  // Avoid duplicate injection
  if (document.getElementById('kalis-floating-companion')) return;

  const psychScore = pendingVerification.psychometricScore || 0;
  const targetSekem = pendingVerification.targetSekem ? pendingVerification.targetSekem.toFixed(1) : '-';
  const targetBagrut = pendingVerification.targetBagrutAverage || pendingVerification.currentBagrutAverage || 0;
  const subjects = pendingVerification.subjects || [];

  // Create Floating Companion Card
  const widget = document.createElement('div');
  widget.id = 'kalis-floating-companion';
  widget.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 999999;
    background: #FAF8F5;
    border: 2px solid #3C3C3C;
    border-radius: 20px;
    padding: 16px 18px;
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
    transition: all 0.3s ease;
  `;

  const subjectsHtml = subjects.map((s, idx) => `
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
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5DFD4; padding-bottom: 8px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">🎓</span>
        <strong style="font-size: 13px; color: #111;">סייען מתקבלים — אימות סכם</strong>
      </div>
      <button id="kalis-close-widget" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #888; padding: 0 4px;">✕</button>
    </div>

    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 10px; padding: 6px; text-align: center;">
        <div style="font-size: 10px; color: #666; font-weight: bold;">סכם צפוי</div>
        <div style="font-size: 15px; font-weight: 900; color: #15803d;">${targetSekem}</div>
      </div>
      <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 10px; padding: 6px; text-align: center;">
        <div style="font-size: 10px; color: #666; font-weight: bold;">פסיכומטרי יעד</div>
        <div style="font-size: 15px; font-weight: 900; color: #222;">${psychScore || 'ללא'}</div>
      </div>
      <div style="flex: 1; background: white; border: 1px solid #E5DFD4; border-radius: 10px; padding: 6px; text-align: center;">
        <div style="font-size: 10px; color: #666; font-weight: bold;">ממוצע בגרות</div>
        <div style="font-size: 15px; font-weight: 900; color: #222;">${targetBagrut ? targetBagrut.toFixed(1) : '-'}</div>
      </div>
    </div>

    <button id="kalis-autofill-btn" style="width: 100%; padding: 9px; background: #3C3C3C; color: white; border: none; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer; transition: background 0.2s; margin-bottom: 8px;">
      ⚡ הזן ציונים לשדות המזוהים בעמוד
    </button>
    <div id="kalis-autofill-feedback" style="font-size: 11px; color: #666; text-align: center; margin-bottom: 8px;">
      לחץ להזנה מהירה או העתק ציונים מהרשימה
    </div>

    <div style="flex: 1; overflow-y: auto; max-height: 180px; padding-right: 2px;">
      ${subjectsHtml}
    </div>
  `;

  document.body.appendChild(widget);

  document.getElementById('kalis-close-widget')?.addEventListener('click', () => {
    widget.remove();
  });

  // Wire individual copy buttons
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

  const autofillBtn = document.getElementById('kalis-autofill-btn');
  const feedback = document.getElementById('kalis-autofill-feedback');

  const setInputValue = (inp, val) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(inp, val);
    } else {
      inp.value = val;
    }
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.dispatchEvent(new Event('blur', { bubbles: true }));
    inp.style.backgroundColor = '#EBF4EE';
    inp.style.borderColor = '#22C55E';
  };

  autofillBtn?.addEventListener('click', () => {
    let filled = 0;
    const inputs = Array.from(document.querySelectorAll('input, select'));

    inputs.forEach((inp) => {
      const txt = (
        (inp.name || '') + ' ' +
        (inp.id || '') + ' ' +
        (inp.placeholder || '') + ' ' +
        (inp.getAttribute('aria-label') || '') + ' ' +
        (inp.parentElement?.textContent || '')
      ).toLowerCase();

      // Psychometric
      if (psychScore > 0 && (txt.includes('פסיכומטרי') || txt.includes('psychometric') || txt.includes('סכם'))) {
        setInputValue(inp, psychScore);
        filled++;
      }

      // Bagrut average
      if (targetBagrut > 0 && (txt.includes('ממוצע') || txt.includes('בגרות') || txt.includes('bagrut'))) {
        setInputValue(inp, targetBagrut.toFixed(1));
        filled++;
      }

      // Check for subject matches
      subjects.forEach((s) => {
        if (txt.includes(s.name.toLowerCase())) {
          setInputValue(inp, s.grade);
          filled++;
        }
      });
    });

    if (feedback) {
      if (filled > 0) {
        feedback.textContent = `✓ הוזנו בהצלחה ${filled} שדות שזוהו בטופס!`;
        feedback.style.color = '#15803d';
        feedback.style.fontWeight = 'bold';
      } else {
        feedback.textContent = 'לא זוהו שדות אוטומטית. השתמש בכפתורי ההעתקה ברשימה.';
      }
    }
  });
})();

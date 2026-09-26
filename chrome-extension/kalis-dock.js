// Kalis Interactive Dock (Manifest V3)
// Floating action dock rendered on university calculator pages.
// Features: Dynamic field detection, On-demand "מלא נתונים", live audit log (filled vs skipped).

(function () {
  'use strict';

  // Universal React (15-19) / Vue / Angular / Native Controlled Input Setter
  function setElementValue(el, val) {
    if (!el || val === undefined || val === null) return false;
    try {
      el.focus();

      if (el.type === 'checkbox') {
        const proto = window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'checked')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, Boolean(val));
        } else {
          el.checked = Boolean(val);
        }
        if (el._valueTracker) {
          el._valueTracker.setValue(!val);
        }
        el.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

        const rKey = Object.keys(el).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
        if (rKey && el[rKey] && typeof el[rKey].onChange === 'function') {
          try { el[rKey].onChange({ target: el, currentTarget: el, bubbles: true }); } catch (e) {}
        }
        return true;
      }

      if (el instanceof HTMLSelectElement) {
        const proto = window.HTMLSelectElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, String(val));
        } else {
          el.value = String(val);
        }
        if (el._valueTracker) {
          el._valueTracker.setValue('');
        }
        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

        const rKey = Object.keys(el).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
        if (rKey && el[rKey] && typeof el[rKey].onChange === 'function') {
          try { el[rKey].onChange({ target: el, currentTarget: el, bubbles: true }); } catch (e) {}
        }
        el.style.backgroundColor = '#EBF4EE';
        el.style.borderColor = '#22C55E';
        return true;
      }

      // Text / Number Input
      const proto = window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, String(val));
      } else {
        el.value = String(val);
      }

      // Reset React 16+ _valueTracker so React registers programmatic change
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }

      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

      // Invoke React synthetic event handler directly if present
      const rKey = Object.keys(el).find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
      if (rKey && el[rKey]) {
        const fakeEvt = {
          target: el,
          currentTarget: el,
          bubbles: true,
          defaultPrevented: false,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        if (typeof el[rKey].onChange === 'function') {
          try { el[rKey].onChange(fakeEvt); } catch (e) {}
        }
        if (typeof el[rKey].onInput === 'function') {
          try { el[rKey].onInput(fakeEvt); } catch (e) {}
        }
      }

      el.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      el.style.backgroundColor = '#EBF4EE';
      el.style.borderColor = '#22C55E';
      el.style.transition = 'background-color 0.4s ease, border-color 0.4s ease';

      return true;
    } catch (err) {
      console.warn('[Kalis Dock] Error setting input value:', err);
      return false;
    }
  }

  class KalisDockUI {
    constructor() {
      this.container = null;
      this.minimizedPill = null;
      this.isMinimized = false;
      this.candidateData = null;
      this.lastScanResult = null;
      this.lastAudit = null;
      this.isFilling = false;
    }

    async init() {
      // Only render in top window to avoid multiple docks inside iframes
      if (window.self !== window.top) return;

      try {
        const storage = await chrome.storage.local.get('pendingVerification');
        this.candidateData = storage?.pendingVerification || null;
      } catch (e) {
        console.warn('[Kalis Dock] Failed to read storage:', e);
      }

      if (!this.candidateData) return;

      const isRecent = (Date.now() - (this.candidateData.timestamp || 0)) < 15 * 60 * 1000;
      if (!isRecent) return;

      this.render();
      this.triggerScan();

      // Listen for DOM changes to update available fields count
      let scanTimeout = null;
      const observer = new MutationObserver(() => {
        if (this.isFilling) return;
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => this.triggerScan(), 500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    triggerScan() {
      if (!window.KalisFieldScanner) return;
      this.lastScanResult = window.KalisFieldScanner.scan(document);
      this.updateScannerUI();
    }

    render() {
      if (document.getElementById('kalis-action-dock')) return;

      // 1. Minimized Pill
      this.minimizedPill = document.createElement('div');
      this.minimizedPill.id = 'kalis-dock-pill';
      this.minimizedPill.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999999;
        background: #3C3C3C;
        color: white;
        border-radius: 30px;
        padding: 8px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", sans-serif;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: none;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        direction: rtl;
        border: 1px solid #111;
        transition: transform 0.2s ease;
      `;
      this.minimizedPill.innerHTML = `
        <span>🎓</span>
        <span>סייען מתקבלים</span>
        <span id="kalis-pill-count" style="background: white; color: #222; padding: 2px 7px; border-radius: 12px; font-size: 11px;">0</span>
      `;
      this.minimizedPill.addEventListener('click', () => this.toggleMinimize(false));
      document.body.appendChild(this.minimizedPill);

      // 2. Main Dock Container
      this.container = document.createElement('div');
      this.container.id = 'kalis-action-dock';
      this.container.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999999;
        width: 340px;
        max-width: calc(100vw - 32px);
        max-height: 85vh;
        background: #FAF8F5;
        border: 2px solid #3C3C3C;
        border-radius: 20px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", sans-serif;
        direction: rtl;
        text-align: right;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #222222;
        transition: transform 0.25s ease, opacity 0.25s ease;
      `;

      const instName = this.candidateData?.institutionName || 'האוניברסיטה';
      const progName = this.candidateData?.programName || '';
      const threshold = this.candidateData?.admissionThreshold ? Number(this.candidateData.admissionThreshold).toFixed(1) : null;
      const sekem = this.candidateData?.targetSekem ? Number(this.candidateData.targetSekem).toFixed(1) : '-';

      this.container.innerHTML = `
        <!-- Top Bar -->
        <div style="background: #FAF8F5; padding: 12px 16px; border-bottom: 1px solid #E5DFD4; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: #3C3C3C; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px;">🎓</div>
            <div>
              <div style="font-weight: 900; font-size: 13px; color: #111;">סייען מתקבלים</div>
              <div style="font-size: 10.5px; color: #666;">אימות סכם חכם מול ${instName}</div>
            </div>
          </div>
          <button id="kalis-dock-minimize" style="background: transparent; border: none; font-size: 16px; cursor: pointer; color: #888; padding: 2px 6px; border-radius: 6px;" title="מזער">_</button>
        </div>

        <!-- Scrollable Content -->
        <div style="padding: 14px 16px; overflow-y: auto; max-height: calc(85vh - 70px); display: flex; flex-direction: column; gap: 12px;">
          <!-- Target Info Box -->
          <div style="background: white; border: 1px solid #E5DFD4; border-radius: 12px; padding: 10px 12px; font-size: 11.5px;">
            ${progName ? `<div style="font-weight: 800; color: #222; margin-bottom: 6px; line-height: 1.4;">${progName}</div>` : ''}
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${threshold ? `
              <div style="display: flex; align-items: center; justify-content: space-between; color: #666;">
                <span>סף קבלה נדרש לתואר:</span>
                <span style="font-weight: 800; font-size: 13px; color: #3C3C3C;">${threshold}</span>
              </div>` : ''}
              <div style="display: flex; align-items: center; justify-content: space-between; color: #555;">
                <span>${threshold ? 'סכם יעד במסלול:' : 'סף קבלה נדרש לחוג:'}</span>
                <span style="font-weight: 900; font-size: 14px; color: #15803d;">${sekem}</span>
              </div>
            </div>
          </div>

          <!-- Dynamic Scan Status -->
          <div id="kalis-dock-status" style="font-size: 11px; color: #666; background: #FAF8F5; border: 1px solid #E5DFD4; border-radius: 10px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
            <span>סורק שדות במחשבון...</span>
            <span style="font-weight: bold; color: #3C3C3C;">0 שדות</span>
          </div>

          <!-- Action Button: Fill Data -->
          <button id="kalis-dock-fill-btn" style="
            width: 100%;
            padding: 12px;
            background: #3C3C3C;
            color: white;
            border: 1px solid #111;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: background 0.2s ease;
          ">
            <span>⚡</span>
            <span id="kalis-fill-btn-text">מלא נתונים במחשבון</span>
          </button>

          <!-- Calculate CTA (if button detected on page) -->
          <button id="kalis-dock-calc-btn" style="
            width: 100%;
            padding: 10px;
            background: white;
            color: #3C3C3C;
            border: 1px solid #3C3C3C;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: background 0.2s ease;
          ">
            <span>חשב סכם באתר</span>
            <span>➔</span>
          </button>

          <!-- Audit Drawer Accordion -->
          <div id="kalis-dock-audit" style="display: none; border-top: 1px solid #E5DFD4; padding-top: 10px;">
            <div style="font-size: 11px; font-weight: 900; color: #444; margin-bottom: 6px;">דוח אימות והזנת נתונים:</div>
            <div id="kalis-audit-content" style="max-height: 180px; overflow-y: auto; font-size: 10.5px; display: flex; flex-direction: column; gap: 4px;"></div>
          </div>
        </div>
      `;

      document.body.appendChild(this.container);

      // Event Listeners
      const minimizeBtn = this.container.querySelector('#kalis-dock-minimize');
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => this.toggleMinimize(true));
      }

      const fillBtn = this.container.querySelector('#kalis-dock-fill-btn');
      if (fillBtn) {
        fillBtn.addEventListener('click', () => this.executeFill());
      }

      const calcBtn = this.container.querySelector('#kalis-dock-calc-btn');
      if (calcBtn) {
        calcBtn.addEventListener('click', () => {
          if (this.lastScanResult?.calculateButton) {
            this.lastScanResult.calculateButton.click();
          }
        });
      }

      // Listen for calculated results reported by institutional calculators (e.g. BGU iframe)
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'KALIS_INSTITUTION_CALCULATED_RESULTS') {
          this.displayInstitutionalResults(event.data);
        }
      });
    }

    displayInstitutionalResults(data) {
      if (!this.container) return;

      const sekemVal = data.sekemQuantity || data.sekemBagrut;
      if (!sekemVal) return;

      const threshold = this.candidateData?.admissionThreshold || this.candidateData?.targetSekem || 0;
      const numSekem = Number(sekemVal);
      const isPassed = threshold > 0 ? numSekem >= Number(threshold) : true;
      const margin = threshold > 0 ? (numSekem - Number(threshold)).toFixed(1) : null;

      let resBox = this.container.querySelector('#kalis-dock-live-results');
      if (!resBox) {
        resBox = document.createElement('div');
        resBox.id = 'kalis-dock-live-results';
        const targetBox = this.container.querySelector('div[style*="background: white"]');
        if (targetBox && targetBox.parentNode) {
          targetBox.parentNode.insertBefore(resBox, targetBox.nextSibling);
        }
      }

      resBox.innerHTML = `
        <div style="background: ${isPassed ? '#ECFDF5' : '#FFFBEB'}; border: 1.5px solid ${isPassed ? '#10B981' : '#F59E0B'}; border-radius: 12px; padding: 10px 12px; font-size: 11.5px; color: ${isPassed ? '#065F46' : '#92400E'};">
          <div style="font-weight: 900; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
            <span>${isPassed ? '🎉 תוצאה רשמית במחשבון:' : '📊 תוצאה רשמית במחשבון:'}</span>
            <span style="font-size: 10px; font-weight: bold; background: white; padding: 2px 7px; border-radius: 6px; border: 1px solid ${isPassed ? '#A7F3D0' : '#FDE68A'};">
              ${isPassed ? 'קבלה מובטחת' : 'נדרש שיפור'}
            </span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span>סכם שחושב באתר:</span>
            <span style="font-weight: 900; font-size: 14px; color: ${isPassed ? '#047857' : '#B45309'};">${sekemVal}</span>
          </div>
          ${data.bagrutAverage ? `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; color: #555; font-size: 10.5px;">
            <span>ממוצע בגרות מוזן:</span>
            <span style="font-weight: 700;">${data.bagrutAverage}</span>
          </div>` : ''}
          <div style="font-size: 10.5px; font-weight: 700; color: ${isPassed ? '#047857' : '#B45309'}; border-top: 1px dashed ${isPassed ? '#A7F3D0' : '#FDE68A'}; padding-top: 4px; margin-top: 4px;">
            ${isPassed ? `עובר את סף הקבלה (${threshold}) ב-+${margin} נקודות!` : `חסרות ${Math.abs(Number(margin))} נקודות לסף הקבלה (${threshold})`}
          </div>
        </div>
      `;

      // Update fill button text and status
      const btnText = this.container.querySelector('#kalis-fill-btn-text');
      if (btnText) btnText.textContent = '✓ הנתונים חושבו בהצלחה באתר';
    }

    toggleMinimize(shouldMinimize) {
      this.isMinimized = shouldMinimize;
      if (shouldMinimize) {
        if (this.container) this.container.style.display = 'none';
        if (this.minimizedPill) this.minimizedPill.style.display = 'flex';
      } else {
        if (this.container) this.container.style.display = 'flex';
        if (this.minimizedPill) this.minimizedPill.style.display = 'none';
      }
    }

    updateScannerUI() {
      if (!this.container || !this.lastScanResult) return;

      const recognized = this.lastScanResult.stats.recognizedCount;
      const statusEl = this.container.querySelector('#kalis-dock-status');
      if (statusEl) {
        statusEl.innerHTML = `
          <span>אותרו שדות מתאימים בעמוד:</span>
          <span style="font-weight: 900; color: #15803d; background: #EBF4EE; padding: 2px 8px; border-radius: 10px;">${recognized} שדות</span>
        `;
      }

      const pillCount = this.minimizedPill?.querySelector('#kalis-pill-count');
      if (pillCount) pillCount.textContent = String(recognized);

      const calcBtn = this.container.querySelector('#kalis-dock-calc-btn');
      if (calcBtn) {
        calcBtn.style.display = this.lastScanResult.calculateButton ? 'flex' : 'none';
      }
    }

    async executeFill() {
      if (this.isFilling || !this.candidateData) return;
      this.isFilling = true;

      const btn = this.container.querySelector('#kalis-dock-fill-btn');
      const btnText = this.container.querySelector('#kalis-fill-btn-text');
      if (btnText) btnText.textContent = 'מזין נתונים במחשבון...';
      if (btn) btn.style.background = '#2A2A2A';

      // 1. Scan current DOM
      const scan = window.KalisFieldScanner.scan(document);
      this.lastScanResult = scan;

      // 2. Handle Degree Search if present and programName is specified
      if (scan.degreeSearchInput && this.candidateData.programName) {
        const dInput = scan.degreeSearchInput;
        if (dInput.value !== this.candidateData.programName) {
          setElementValue(dInput, this.candidateData.programName);
          // Trigger keyboard and input events to trigger dropdown
          dInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
      }

      // 3. Evaluate each discovered field strictly with KalisDataGuard
      const auditLog = [];
      let filledCount = 0;
      let skippedCount = 0;

      for (const field of scan.fields) {
        const evaluation = window.KalisDataGuard.evaluateField(field, this.candidateData);

        if (evaluation.shouldFill && evaluation.value !== null) {
          const success = setElementValue(field.element, evaluation.value);
          if (success) {
            filledCount++;
            auditLog.push({
              status: 'FILLED',
              label: field.label,
              value: evaluation.value,
              reason: evaluation.reason
            });
          }
        } else {
          skippedCount++;
          auditLog.push({
            status: evaluation.status,
            label: field.label,
            value: null,
            reason: evaluation.reason
          });
        }
      }

      this.lastAudit = auditLog;
      this.renderAuditReport(auditLog, filledCount, skippedCount);

      // Reset button state
      setTimeout(() => {
        this.isFilling = false;
        if (btnText) btnText.textContent = `✓ הוזנו ${filledCount} נתונים בהצלחה!`;
        if (btn) btn.style.background = '#15803d';

        setTimeout(() => {
          if (btnText) btnText.textContent = 'מלא נתונים שוב';
          if (btn) btn.style.background = '#3C3C3C';
        }, 4000);
      }, 600);
    }

    renderAuditReport(auditLog, filledCount, skippedCount) {
      const drawer = this.container.querySelector('#kalis-dock-audit');
      const content = this.container.querySelector('#kalis-audit-content');
      if (!drawer || !content) return;

      drawer.style.display = 'block';

      content.innerHTML = auditLog.map((item) => {
        if (item.status === 'FILLED') {
          return `
            <div style="background: #EBF4EE; border: 1px solid #C6DFCE; border-radius: 8px; padding: 5px 8px; color: #15803d;">
              <div style="font-weight: 800; display: flex; justify-content: space-between;">
                <span>✓ ${item.label}</span>
                <span style="font-weight: 900;">${item.value}</span>
              </div>
              <div style="font-size: 9.5px; color: #205739; margin-top: 1px;">${item.reason}</div>
            </div>
          `;
        }

        if (item.status === 'SKIPPED_NO_DATA') {
          return `
            <div style="background: #FAF8F5; border: 1px solid #E5DFD4; border-radius: 8px; padding: 5px 8px; color: #666;">
              <div style="font-weight: 700; color: #444;">⚪ ${item.label} (שדה נותר ריק)</div>
              <div style="font-size: 9.5px; color: #888; margin-top: 1px;">${item.reason}</div>
            </div>
          `;
        }

        return `
          <div style="background: #FAF8F5; border: 1px solid #E5DFD4; border-radius: 8px; padding: 4px 8px; color: #888;">
            <div style="font-weight: 600;">🔒 ${item.label}</div>
            <div style="font-size: 9.5px;">${item.reason}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Initialize and attach to global
  window.KalisDock = new KalisDockUI();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.KalisDock.init());
  } else {
    window.KalisDock.init();
  }

  console.log('[Kalis Dock] Module loaded successfully.');
})();

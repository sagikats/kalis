// Kalis Content Script: Technion Calculator AutoFill
// Target: admissions.technion.ac.il/*
// Integrates with KalisDataGuard, KalisFieldScanner, and KalisDock

(async function () {
  'use strict';
  console.log('[Kalis Technion] Script active on:', window.location.href);

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis Technion] Error reading storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  // Reveal Technion's bagrut form if hidden behind radio
  const initTechnionForm = () => {
    const bagrotRadio = document.querySelector('#bagrotYes, input[name="bagrot"][value="yes"]');
    if (bagrotRadio && !bagrotRadio.checked) {
      bagrotRadio.checked = true;
      bagrotRadio.dispatchEvent(new Event('click', { bubbles: true }));
      bagrotRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const bagrotForm = document.getElementById('bagrotForm');
    if (bagrotForm) {
      bagrotForm.style.display = 'block';
    }

    // Trigger dock scan
    if (window.KalisDock && typeof window.KalisDock.triggerScan === 'function') {
      window.KalisDock.triggerScan();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTechnionForm);
  } else {
    initTechnionForm();
  }

  setTimeout(initTechnionForm, 800);

  console.log('[Kalis Technion] Integrated with KalisDock.');
})();

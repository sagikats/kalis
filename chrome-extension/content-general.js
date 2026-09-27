// Kalis Content Script: Universal AutoFill for Israeli University Calculators
// Target: Bar-Ilan (BIU - Shoham), Haifa (UOH), Ariel (AU), Reichman (RUNI), and general portals
// Integrates with KalisDataGuard, KalisFieldScanner, and KalisDock

(async function () {
  'use strict';
  console.log('[Kalis General] Universal script active on:', window.location.href);

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis General] Error reading storage:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  // Trigger initial dock scan once DOM is loaded
  const onReady = () => {
    if (window.KalisDock && typeof window.KalisDock.triggerScan === 'function') {
      window.KalisDock.triggerScan();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  setTimeout(onReady, 600);
  setTimeout(onReady, 1800);

  // Listen for data update events when user switches tracks in web app
  window.addEventListener('kalis:data-updated', () => {
    console.log('[Kalis General] Received updated track data, re-scanning...');
    onReady();
  });

  console.log('[Kalis General] Integrated with KalisDock.');
})();

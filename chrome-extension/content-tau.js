// Kalis Content Script: Tel Aviv University (TAU)
// Target: go.tau.ac.il/* and *.tau.ac.il/*
// Integrates with KalisDataGuard, KalisFieldScanner, and KalisDock

(async function () {
  'use strict';
  console.log('[Kalis TAU] Script active on:', window.location.href);

  let storageData;
  try {
    storageData = await chrome.storage.local.get('pendingVerification');
  } catch (err) {
    console.error('[Kalis TAU] Storage error:', err);
    return;
  }

  const pendingVerification = storageData?.pendingVerification;
  if (!pendingVerification) return;

  const isRecent = (Date.now() - (pendingVerification.timestamp || 0)) < 15 * 60 * 1000;
  if (!isRecent) return;

  // Wait for TAU's React calculator container to appear and scroll to it
  const waitForTauCalculator = async (timeout = 6000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const calcContainer = document.querySelector(
        '[id*="cr-b918853940b72a520b94ed750266d2af"], .suitability-calc, [data-drupal-selector*="calculator"]'
      );
      if (calcContainer) return calcContainer;
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  };

  waitForTauCalculator().then((container) => {
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger a scan in dock once container is located
      if (window.KalisDock && typeof window.KalisDock.triggerScan === 'function') {
        window.KalisDock.triggerScan();
      }
    }
  });

  console.log('[Kalis TAU] Integrated with KalisDock.');
})();

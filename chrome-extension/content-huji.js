// Kalis Content Script: Hebrew University of Jerusalem (HUJI)
// Target: go.huji.ac.il/* and *.huji.ac.il/*
// Integrates with KalisDataGuard, KalisFieldScanner, and KalisDock

(async function () {
  'use strict';
  console.log('[Kalis HUJI] Script initialized on:', window.location.href);

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

  const programName = pendingVerification.programName || '';

  // Helper to open the admission calculator modal if not already open
  const ensureAdmissionCalculatorOpen = () => {
    if (document.querySelector('#admission-check')) return true;

    const openBtn = document.querySelector('#admission-all-btn') ||
      Array.from(document.querySelectorAll('a, button, div, span')).find((el) => {
        const t = (el.textContent || '').trim();
        return t.includes('בדיקת סיכויי הקבלה לכל החוגים') || t.includes('מחשבון קבלה לכל החוגים');
      });

    if (openBtn && typeof openBtn.click === 'function') {
      console.log('[Kalis HUJI] Opening admission calculator modal...');
      openBtn.click();
      return true;
    }

    return Boolean(document.querySelector('#admission-check'));
  };

  // 1. Degree Search Selection Handler (HUJI-specific)
  let hasHandledDegreeSearch = false;
  const handleDegreeSearch = () => {
    if (hasHandledDegreeSearch || !programName) return;

    const searchBar = document.querySelector('input.search-bar') ||
      (window.KalisFieldScanner && window.KalisFieldScanner.scan().degreeSearchInput);

    if (searchBar && searchBar.value !== programName) {
      hasHandledDegreeSearch = true;
      console.log('[Kalis HUJI] Entering programName into degree search bar:', programName);

      searchBar.focus();
      searchBar.value = programName;
      searchBar.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      searchBar.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // Wait for matching degree in search results and click it
      setTimeout(() => {
        const results = Array.from(
          document.querySelectorAll('.search-results a, .search-results div, .search-results .result, a[href*="programAdmission"]')
        );
        const match = results.find((r) => (r.textContent || '').includes(programName)) || results[0];
        if (match && typeof match.click === 'function') {
          console.log('[Kalis HUJI] Selecting matching degree:', match.textContent);
          match.click();
        }
      }, 600);
    }
  };

  // Launch initial checks
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      handleDegreeSearch();
      ensureAdmissionCalculatorOpen();
    });
  } else {
    handleDegreeSearch();
    ensureAdmissionCalculatorOpen();
  }

  // Observe page mutations for modal opening or search results
  const observer = new MutationObserver(() => {
    if (!hasHandledDegreeSearch && programName) {
      handleDegreeSearch();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[Kalis HUJI] Ready and integrated with KalisDock.');
})();

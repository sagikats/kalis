// Kalis Bridge Script (Injected on mitkablim.co.il and localhost)

(function () {
  console.log('[Kalis Extension] Bridge loaded on web app.');

  // Set window global without touching HTML DOM attributes prematurely
  try {
    window.__kalis_extension_installed = true;
  } catch (e) {}

  // Announce presence via window postMessage
  window.postMessage({ type: 'KALIS_EXTENSION_READY', version: '1.1.0' }, '*');

  // Also dispatch a custom DOM event
  try {
    window.dispatchEvent(new CustomEvent('kalis:extension-ready', {
      detail: { version: '1.1.0' }
    }));
  } catch (e) {}

  // Delay setting DOM attribute by 600ms so React hydration completes smoothly
  setTimeout(() => {
    try {
      document.documentElement.setAttribute('data-kalis-extension-installed', 'true');
      document.documentElement.dataset.kalisExtension = 'true';
    } catch (e) {}
  }, 600);

  // Listen for requests originating from the Kalis web app
  window.addEventListener('message', async (event) => {
    // Only accept messages from the current window
    if (event.source !== window) return;

    if (event.data?.type === 'KALIS_PING_EXTENSION') {
      const isAlive = Boolean(chrome?.runtime?.id);
      window.postMessage({ type: 'KALIS_PONG_EXTENSION', version: '1.1.0', isAlive }, '*');
      return;
    }

    if (event.data?.type === 'KALIS_TRIGGER_AUTOFILL') {
      try {
        if (!chrome?.runtime?.id) {
          throw new Error('Extension context invalidated');
        }

        const response = await chrome.runtime.sendMessage({
          type: 'KALIS_START_VERIFICATION',
          data: event.data.payload
        });

        window.postMessage({
          type: 'KALIS_AUTOFILL_STARTED',
          success: response?.success,
          tabId: response?.tabId
        }, '*');
      } catch (err) {
        const isInvalidated = (err?.message || '').includes('Extension context invalidated') || !chrome?.runtime?.id;
        if (isInvalidated) {
          console.warn('[Kalis Extension] Extension was reloaded in browser. Please refresh the page (F5).');
        } else {
          console.error('[Kalis Extension] Bridge error sending autofill request:', err);
        }

        window.postMessage({
          type: 'KALIS_AUTOFILL_STARTED',
          success: false,
          needsReload: isInvalidated,
          error: isInvalidated
            ? 'התוסף עודכן בדפדפן. אנא רענן את העמוד (F5) כדי להפעיל אותו מחדש.'
            : (err?.message || 'שגיאה בהפעלת התוסף')
        }, '*');
      }
    }
  });
})();

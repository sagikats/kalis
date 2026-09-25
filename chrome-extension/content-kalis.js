// Kalis Bridge Script (Injected on mitkablim.co.il and localhost)

(function () {
  console.log('[Kalis Extension] Bridge loaded on web app.');

  // Set window global without touching HTML DOM attributes prematurely
  try {
    window.__kalis_extension_installed = true;
  } catch (e) {}

  // Announce presence via window postMessage
  window.postMessage({ type: 'KALIS_EXTENSION_READY', version: '1.0.0' }, '*');

  // Also dispatch a custom DOM event
  try {
    window.dispatchEvent(new CustomEvent('kalis:extension-ready', {
      detail: { version: '1.0.0' }
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
      window.postMessage({ type: 'KALIS_PONG_EXTENSION', version: '1.0.0' }, '*');
      return;
    }

    if (event.data?.type === 'KALIS_TRIGGER_AUTOFILL') {
      try {
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
        console.error('[Kalis Extension] Bridge error sending autofill request:', err);
        window.postMessage({
          type: 'KALIS_AUTOFILL_STARTED',
          success: false,
          error: err.message
        }, '*');
      }
    }
  });
})();

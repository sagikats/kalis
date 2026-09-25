// Kalis Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Kalis Extension] Installed successfully.');
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KALIS_START_VERIFICATION') {
    (async () => {
      try {
        const payload = message.data;
        // Save the verification session data in persistent storage
        await chrome.storage.local.set({
          pendingVerification: {
            ...payload,
            timestamp: Date.now()
          }
        });

        // Open the university calculator in a new tab
        const tab = await chrome.tabs.create({
          url: payload.calculatorUrl,
          active: true
        });

        sendResponse({ success: true, tabId: tab.id });
      } catch (err) {
        console.error('[Kalis Extension] Failed to start verification:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.0.0' });
    return false;
  }
});

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

        // Check if there is an existing tab already open for this university calculator
        let existingTab = null;
        try {
          const calcUrlObj = new URL(payload.calculatorUrl);
          const allTabs = await chrome.tabs.query({});
          existingTab = allTabs.find((t) => t.url && t.url.includes(calcUrlObj.hostname));
        } catch (e) {}

        let tab;
        if (existingTab && existingTab.id) {
          // Activate existing tab
          tab = await chrome.tabs.update(existingTab.id, { active: true });
          if (existingTab.url !== payload.calculatorUrl) {
            tab = await chrome.tabs.update(existingTab.id, { url: payload.calculatorUrl, active: true });
          }
          try {
            chrome.tabs.sendMessage(existingTab.id, {
              type: 'KALIS_VERIFICATION_UPDATED',
              data: payload,
              autoFill: true
            });
          } catch (e) {
            // If tab content script is unmounted or disconnected, reload tab
            chrome.tabs.reload(existingTab.id);
          }
        } else {
          // Open the university calculator in a new tab
          tab = await chrome.tabs.create({
            url: payload.calculatorUrl,
            active: true
          });
        }

        sendResponse({ success: true, tabId: tab.id });
      } catch (err) {
        console.error('[Kalis Extension] Failed to start verification:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.2.0' });
    return false;
  }
});

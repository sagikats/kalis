// Popup script (Manifest V3)

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { pendingVerification } = await chrome.storage.local.get('pendingVerification');
    const sessionInfo = document.getElementById('session-info');

    if (pendingVerification && sessionInfo) {
      const timeAgo = Math.round((Date.now() - (pendingVerification.timestamp || 0)) / 1000 / 60);
      if (timeAgo < 60) {
        sessionInfo.innerHTML = `
          <div style="font-weight: bold; color: #15803d; margin-bottom: 4px;">נתוני אימות אחרונים מוכנים:</div>
          <div style="font-size: 11px; color: #444; line-height: 1.5;">
            • מוסד: <strong>${pendingVerification.institutionName || 'אוניברסיטה'}</strong><br>
            • פסיכומטרי: <strong>${pendingVerification.psychometricScore || 'ללא'}</strong><br>
            • מקצועות: <strong>${pendingVerification.subjects?.length || 0} מקצועות בגרות</strong>
          </div>
        `;
      }
    }

    const openBtn = document.getElementById('open-app-btn');
    if (openBtn) {
      openBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const tabs = await chrome.tabs.query({});
          const kalisTab = tabs.find((t) => t.url && (t.url.includes('mitkablim.co.il') || t.url.includes('localhost:3000')));
          if (kalisTab && kalisTab.id) {
            await chrome.tabs.update(kalisTab.id, { active: true });
            if (kalisTab.windowId) {
              await chrome.windows.update(kalisTab.windowId, { focused: true });
            }
            window.close();
            return;
          }
        } catch (tabErr) {
          console.error('Error finding active Kalis tab:', tabErr);
        }
        await chrome.tabs.create({ url: 'http://localhost:3000/flow', active: true });
        window.close();
      });
    }
  } catch (err) {
    console.error('Error in popup DOMContentLoaded:', err);
  }
});

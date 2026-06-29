// DOM Watch — Content Script
// Injects MutationObserver on the active page, reports changes to background.

(function () {
  let observer = null;
  let lastKnownText = '';

  async function getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get('watchConfig', (result) => {
        resolve(result.watchConfig || { selector: '', label: '', enabled: false });
      });
    });
  }

  function startObserver(selector) {
    if (observer) observer.disconnect();

    const target = document.querySelector(selector);
    if (!target) {
      console.warn(`[DOM Watch] Selector "${selector}" not found on page`);
      return false;
    }

    lastKnownText = (target.textContent || '').trim();

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const currentText = (target.textContent || '').trim();
          if (currentText !== lastKnownText) {
            chrome.runtime.sendMessage({
              type: 'DOM_CHANGE_DETECTED',
              oldText: lastKnownText,
              newText: currentText,
              url: window.location.href
            });
            lastKnownText = currentText;
          }
        }
      }
    });

    observer.observe(target, {
      childList: true,
      characterData: true,
      subtree: true
    });

    console.log(`[DOM Watch] Watching "${selector}" — initial text: "${lastKnownText.slice(0, 80)}"`);
    return true;
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log('[DOM Watch] Observer stopped');
    }
  }

  // Listen for config changes from popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'START_WATCH') {
      const ok = startObserver(message.selector);
      sendResponse({ success: ok });
    }
    if (message.type === 'STOP_WATCH') {
      stopObserver();
      sendResponse({ success: true });
    }
    if (message.type === 'CHECK_SELECTOR') {
      const el = document.querySelector(message.selector);
      sendResponse({
        found: !!el,
        currentText: el ? (el.textContent || '').trim().slice(0, 200) : ''
      });
    }
  });

  // Auto-start on page load if enabled
  getConfig().then((config) => {
    if (config.enabled && config.selector) {
      startObserver(config.selector);
    }
  });
})();

// DOM Watch — Background Service Worker
// Handles: chrome.storage persistence, notifications, Apps Script webhook dispatch

const WEBHOOK_URL_KEY = 'webhookUrl';
const WATCH_CONFIG_KEY = 'watchConfig';
const LOG_HISTORY_KEY = 'logHistory';

// --- Storage helpers ---
async function getWatchConfig() {
  const result = await chrome.storage.local.get(WATCH_CONFIG_KEY);
  return result[WATCH_CONFIG_KEY] || { selector: '', label: 'default', enabled: false };
}

async function getWebhookUrl() {
  const result = await chrome.storage.local.get(WEBHOOK_URL_KEY);
  return result[WEBHOOK_URL_KEY] || '';
}

async function appendLog(entry) {
  const result = await chrome.storage.local.get(LOG_HISTORY_KEY);
  const history = result[LOG_HISTORY_KEY] || [];
  history.unshift({ ...entry, timestamp: new Date().toISOString() });
  // Keep last 200 entries
  await chrome.storage.local.set({ [LOG_HISTORY_KEY]: history.slice(0, 200) });
}

// --- Webhook dispatch (Apps Script) ---
async function sendToSheets(payload) {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    console.warn('[DOM Watch] No webhook URL configured — skipping Google Sheets log');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script webhooks require no-cors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: payload.label,
        selector: payload.selector,
        oldText: payload.oldText,
        newText: payload.newText,
        url: payload.url,
        timestamp: new Date().toISOString()
      })
    });
    console.log('[DOM Watch] Webhook dispatched');
    return true;
  } catch (err) {
    console.error('[DOM Watch] Webhook failed:', err);
    return false;
  }
}

// --- Notification ---
function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 1
  });
}

// --- Message handlers from content script ---
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'DOM_CHANGE_DETECTED') {
    const config = await getWatchConfig();
    const label = config.label || 'default';

    const payload = {
      label,
      selector: config.selector,
      oldText: message.oldText,
      newText: message.newText,
      url: sender.tab?.url || message.url
    };

    // Log locally
    await appendLog(payload);

    // Fire notification
    notify(
      `[${label}] DOM Change`,
      `${payload.selector}: "${message.oldText?.slice(0, 50)}" → "${message.newText?.slice(0, 50)}"`
    );

    // Dispatch to Google Sheets
    await sendToSheets(payload);
  }

  if (message.type === 'GET_STATUS') {
    const config = await getWatchConfig();
    const webhookUrl = await getWebhookUrl();
    const result = await chrome.storage.local.get(LOG_HISTORY_KEY);
    return {
      config,
      webhookConfigured: !!webhookUrl,
      logCount: (result[LOG_HISTORY_KEY] || []).length
    };
  }
});

// Startup
console.log('[DOM Watch] Service worker started');

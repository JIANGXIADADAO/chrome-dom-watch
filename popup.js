// DOM Watch — Popup Controller

const selectorInput = document.getElementById('selector');
const labelInput = document.getElementById('label');
const webhookInput = document.getElementById('webhookUrl');
const statusDot = document.getElementById('statusDot');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnTest = document.getElementById('btnTest');
const logPreview = document.getElementById('logPreview');
const logEntries = document.getElementById('logEntries');

// Load saved config on open
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['watchConfig', 'webhookUrl', 'logHistory']);

  if (result.watchConfig) {
    selectorInput.value = result.watchConfig.selector || '';
    labelInput.value = result.watchConfig.label || '';
    updateStatusDot(result.watchConfig.enabled);
  }
  if (result.webhookUrl) {
    webhookInput.value = result.webhookUrl;
  }
  if (result.logHistory && result.logHistory.length > 0) {
    renderLogs(result.logHistory.slice(0, 5));
  }
});

function updateStatusDot(enabled) {
  statusDot.className = 'status-dot ' + (enabled ? 'on' : 'off');
}

function renderLogs(logs) {
  logPreview.style.display = 'block';
  logEntries.innerHTML = logs.map((entry) =>
    `<div class="log-entry">[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.label}: "${String(entry.oldText).slice(0, 40)}" → "${String(entry.newText).slice(0, 40)}"</div>`
  ).join('');
}

// Persist config
async function saveConfig(enabled) {
  const config = {
    selector: selectorInput.value.trim(),
    label: labelInput.value.trim() || 'default',
    enabled
  };
  const webhookUrl = webhookInput.value.trim();

  await chrome.storage.local.set({
    watchConfig: config,
    webhookUrl
  });

  return config;
}

// Start
btnStart.addEventListener('click', async () => {
  const config = await saveConfig(true);
  updateStatusDot(true);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    chrome.tabs.sendMessage(tab.id, {
      type: 'START_WATCH',
      selector: config.selector
    });
  }
});

// Stop
btnStop.addEventListener('click', async () => {
  await saveConfig(false);
  updateStatusDot(false);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'STOP_WATCH' });
  }
});

// Test selector
btnTest.addEventListener('click', async () => {
  const selector = selectorInput.value.trim();
  if (!selector) return alert('Enter a CSS selector first.');

  // Save config first
  await saveConfig(false);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CHECK_SELECTOR',
      selector
    });
    if (response && response.found) {
      alert(`Selector found!\n\nCurrent text: "${response.currentText}"`);
    } else {
      alert(`Selector "${selector}" NOT found on this page.\nCheck the selector and try again.`);
    }
  } catch (e) {
    alert('Could not check selector on this page. Try refreshing the tab.');
  }
});

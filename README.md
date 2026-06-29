# DOM Watch — Chrome Extension (Manifest V3)

Watch any page element for changes. Logs to Google Sheets, fires browser notifications.

**Built with:** Manifest V3 · MutationObserver · Apps Script Webhook · chrome.storage

## How it works

1. Enter a CSS selector (e.g. `#price`, `.stock-value`)
2. Set an environment label (e.g. `production`, `staging`)
3. Optionally paste a Google Apps Script webhook URL
4. Click **Start Watch**

The extension injects a `MutationObserver` on the active tab. When the target element's text changes, it:
- Fires a browser notification
- Logs to Google Sheets via Apps Script webhook (if configured)
- Records locally in chrome.storage for popup preview

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Extension Manifest | Manifest V3 |
| Background | Service Worker |
| DOM Monitoring | MutationObserver (childList + characterData + subtree) |
| Persistent Storage | chrome.storage.local |
| External Logging | Google Apps Script `doPost()` webhook |
| Popup UI | Vanilla HTML/CSS/JS (no framework) |

## Installation (dev)

1. Clone this repo
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select this folder
5. Pin the extension for easy access

## Apps Script Webhook Setup (optional)

Create a Google Apps Script:

```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getActiveSheet();
  sheet.appendRow([
    data.timestamp,
    data.label,
    data.selector,
    data.oldText,
    data.newText,
    data.url
  ]);
  return ContentService.createTextOutput('OK');
}
```

Deploy as web app → copy URL → paste into extension popup.

## Project Structure

```
├── manifest.json      # MV3 manifest
├── background.js      # Service worker: storage, notifications, webhook dispatch
├── content.js         # MutationObserver injection
├── popup.html         # Popup UI
├── popup.js           # Popup controller
└── README.md
```

## License

MIT

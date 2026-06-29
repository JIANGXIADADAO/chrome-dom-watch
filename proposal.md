**Proposal for: Chrome Extension Developer Project — Background Tab Monitor + Google Sheets Logger**

---

**1. Have you built a Chrome extension using Manifest V3? If yes, share an example.**

Yes. Built one this week that uses the exact same stack you're asking for — Manifest V3, MutationObserver, Apps Script webhook, chrome.storage.

Repo: https://github.com/JIANGXIADADAO/chrome-dom-watch
Demo (30s): https://github.com/JIANGXIADADAO/chrome-dom-watch/blob/master/demo.webm

It watches any CSS selector on a page for text changes, fires browser notifications, and dispatches logs to Google Sheets via an Apps Script `doPost()` endpoint. Your project is essentially the same pattern: observe a tab → detect an event → log it → notify. Swap the selector and the trigger condition, and the skeleton is identical.

**2. Would you use the Google Sheets API directly or an Apps Script webhook, and why?**

Apps Script webhook. Here's why:

- **No OAuth.** The Sheets API requires setting up a Google Cloud Console project, enabling the Sheets API, handling OAuth 2.0 tokens with a refresh flow, and requesting the `https://www.googleapis.com/auth/spreadsheets` scope. That's ~200 lines of auth boilerplate for what should be a one-line log call.
- **Apps Script is one function.** A `doPost(e)` receives the JSON payload and calls `sheet.appendRow()`. Deploy, copy the URL, done. For a lightweight logging extension, that's the right tradeoff.
- **Upgrade path exists.** If you ever need to read data back from the sheet or do complex queries, we swap the webhook for the Sheets API later — the extension's architecture doesn't change, just the transport layer.

**3. What is your estimated timeline and fixed price?**

**$150, 2 days.**

- Day 1: Working prototype — MutationObserver wiring, event detection logic, Sheets logging via webhook, chrome.storage persistence for the environment label selector.
- Day 2: Polish — notification behavior, edge cases (tab sleep, page reload, multiple matches), popup UI for the environment selector, final test pass.

Deliverable is a clean repo you can load as an unpacked extension, plus the Apps Script snippet for the Sheets side.

---

No agency overhead — it's just me writing the code. Happy to jump on a quick call or async chat if you want to walk through the approach before committing.

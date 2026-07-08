// Background service worker for METER extension
// Opens the side panel when the action button is clicked.

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

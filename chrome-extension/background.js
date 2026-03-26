/**
 * FocusLens Chrome Extension — Background Service Worker
 * WHITELIST MODE: Blocks ALL websites except allowed ones.
 */

const SYSTEM_ALLOWED = [
  "localhost",
  "127.0.0.1",
  "chrome.google.com",
  "chromewebstore.google.com",
  "chrome-extension",
];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[FocusLens BG] received:", msg.type);

  if (msg.type === "UPDATE_ALLOWLIST") {
    chrome.storage.local.set({ allowlist: msg.sites || [] }, () => {
      chrome.storage.local.get("sessionActive", (data) => {
        if (data.sessionActive) {
          rebuildRules(msg.sites || []).then(() => sendResponse({ success: true }));
        } else {
          sendResponse({ success: true });
        }
      });
    });
    return true; // async
  }

  if (msg.type === "SET_SESSION_ACTIVE") {
    const active = !!msg.active;
    chrome.storage.local.set({ sessionActive: active }, () => {
      if (active) {
        chrome.storage.local.get("allowlist", (data) => {
          rebuildRules(data.allowlist || []).then(() => {
            console.log("[FocusLens BG] Session STARTED, rules active");
            sendResponse({ success: true, active: true });
          });
        });
      } else {
        clearAllRules().then(() => {
          console.log("[FocusLens BG] Session STOPPED, all unblocked");
          sendResponse({ success: true, active: false });
        });
      }
    });
    return true; // async
  }

  if (msg.type === "GET_STATUS") {
    chrome.storage.local.get(["sessionActive", "allowlist"], (data) => {
      sendResponse({
        active: data.sessionActive || false,
        allowlist: data.allowlist || ["blackboard.towson.edu", "towson.edu"],
      });
    });
    return true; // async
  }
});

async function rebuildRules(allowlist) {
  const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");
  const allAllowed = [...SYSTEM_ALLOWED, ...allowlist];

  try {
    // Clear existing rules
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeIds = existing.map((r) => r.id);

    const addRules = [];

    // Rule 1: Block ALL navigations (priority 1)
    addRules.push({
      id: 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: BLOCKED_PAGE },
      },
      condition: {
        urlFilter: "|http",
        resourceTypes: ["main_frame"],
      },
    });

    // Rules 2+: Allow whitelisted domains (priority 2 overrides block)
    allAllowed.forEach((domain, i) => {
      addRules.push({
        id: i + 2,
        priority: 2,
        action: { type: "allow" },
        condition: {
          requestDomains: [domain],
          resourceTypes: ["main_frame"],
        },
      });
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: addRules,
    });

    console.log("[FocusLens BG] Rules set: blocking all except", allAllowed);
  } catch (err) {
    console.error("[FocusLens BG] Rule error:", err);
  }
}

async function clearAllRules() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((r) => r.id),
      addRules: [],
    });
    console.log("[FocusLens BG] All rules cleared");
  } catch (err) {
    console.error("[FocusLens BG] Clear error:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    sessionActive: false,
    allowlist: ["blackboard.towson.edu", "towson.edu"],
  });
  console.log("[FocusLens BG] Installed, defaults set");
});

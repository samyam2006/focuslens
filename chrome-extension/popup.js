/**
 * FocusLens Popup — All event listeners attached via JS
 * (Chrome MV3 CSP blocks inline onclick handlers)
 */

let isActive = false;
let allowlist = [];

// DOM refs
const statusEl = document.getElementById("status");
const dotEl = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");
const siteListEl = document.getElementById("siteList");
const newSiteInput = document.getElementById("newSite");
const addBtn = document.getElementById("addBtn");
const errorMsg = document.getElementById("errorMsg");

// ── Load initial state ──
chrome.storage.local.get(["sessionActive", "allowlist"], (data) => {
  isActive = data.sessionActive || false;
  allowlist = data.allowlist || ["blackboard.towson.edu", "towson.edu"];
  updateUI();
});

// ── Event listeners ──
toggleBtn.addEventListener("click", () => {
  isActive = !isActive;
  toggleBtn.textContent = "Updating…";
  toggleBtn.disabled = true;

  chrome.runtime.sendMessage(
    { type: "SET_SESSION_ACTIVE", active: isActive },
    (response) => {
      toggleBtn.disabled = false;
      if (chrome.runtime.lastError) {
        showError("Failed: " + chrome.runtime.lastError.message);
        isActive = !isActive; // revert
      }
      updateUI();
    }
  );
});

addBtn.addEventListener("click", () => {
  addSite();
});

newSiteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});

// ── Functions ──
function updateUI() {
  if (isActive) {
    statusEl.className = "status status--active";
    dotEl.className = "dot dot--on";
    statusText.textContent = "Focus Session Active — Sites Blocked";
    toggleBtn.textContent = "Stop Session (Unblock All)";
    toggleBtn.className = "toggle-btn toggle-btn--stop";
  } else {
    statusEl.className = "status status--inactive";
    dotEl.className = "dot dot--off";
    statusText.textContent = "Session Inactive — All Sites Open";
    toggleBtn.textContent = "Start Focus Session";
    toggleBtn.className = "toggle-btn toggle-btn--start";
  }
  renderSites();
}

function renderSites() {
  if (allowlist.length === 0) {
    siteListEl.innerHTML = '<div class="empty">No allowed sites — everything blocked!</div>';
    return;
  }
  siteListEl.innerHTML = "";
  allowlist.forEach((site, i) => {
    const row = document.createElement("div");
    row.className = "site-item";

    const label = document.createElement("span");
    label.textContent = "✅ " + site;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => removeSite(i));

    row.appendChild(label);
    row.appendChild(removeBtn);
    siteListEl.appendChild(row);
  });
}

function addSite() {
  const raw = newSiteInput.value.trim().toLowerCase();
  if (!raw) return;
  const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (allowlist.includes(domain)) return;

  allowlist.push(domain);
  newSiteInput.value = "";

  chrome.runtime.sendMessage(
    { type: "UPDATE_ALLOWLIST", sites: allowlist },
    (response) => {
      if (chrome.runtime.lastError) {
        showError("Failed to update: " + chrome.runtime.lastError.message);
      }
    }
  );
  renderSites();
}

function removeSite(index) {
  allowlist.splice(index, 1);
  chrome.runtime.sendMessage(
    { type: "UPDATE_ALLOWLIST", sites: allowlist },
    (response) => {
      if (chrome.runtime.lastError) {
        showError("Failed to update: " + chrome.runtime.lastError.message);
      }
    }
  );
  renderSites();
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
  setTimeout(() => {
    errorMsg.style.display = "none";
  }, 4000);
}

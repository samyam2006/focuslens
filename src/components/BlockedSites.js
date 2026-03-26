import React, { useState, useEffect } from "react";
import { Shield, Plus, X, Globe, ArrowLeftRight, Lock, Check } from "lucide-react";
import { getAllowlist, saveAllowlist } from "../utils/sessionStore";
import { formatTime } from "../utils/helpers";

const PRESET_ALLOWED = [
  { domain: "blackboard.towson.edu", label: "Towson Blackboard" },
  { domain: "towson.edu", label: "Towson University" },
  { domain: "docs.google.com", label: "Google Docs" },
  { domain: "drive.google.com", label: "Google Drive" },
  { domain: "scholar.google.com", label: "Google Scholar" },
  { domain: "stackoverflow.com", label: "Stack Overflow" },
  { domain: "github.com", label: "GitHub" },
  { domain: "chat.openai.com", label: "ChatGPT" },
];

export default function BlockedSites({ tabSwitchCount, timeAway, isTracking }) {
  const [allowlist, setAllowlist] = useState([]);
  const [newSite, setNewSite] = useState("");

  useEffect(() => {
    setAllowlist(getAllowlist());
  }, []);

  const addSite = (domain) => {
    if (!domain.trim()) return;
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (allowlist.includes(clean)) return;
    const updated = [...allowlist, clean];
    setAllowlist(updated);
    saveAllowlist(updated);
    setNewSite("");
  };

  const removeSite = (domain) => {
    const updated = allowlist.filter((d) => d !== domain);
    setAllowlist(updated);
    saveAllowlist(updated);
  };

  const togglePreset = (domain) => {
    if (allowlist.includes(domain)) {
      removeSite(domain);
    } else {
      addSite(domain);
    }
  };

  return (
    <div className="panel blocked-panel">
      <div className="blocked-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={14} color="#00ffc8" />
          <span className="section-label" style={{ margin: 0 }}>Focus Shield</span>
        </div>
      </div>

      {/* Mode explanation */}
      <div style={{
        padding: "10px 12px",
        background: "rgba(255,61,90,0.06)",
        border: "1px solid rgba(255,61,90,0.12)",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        lineHeight: 1.5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ff3d5a", fontWeight: 600, marginBottom: 4 }}>
          <Lock size={12} /> Whitelist Mode
        </div>
        <span style={{ color: "#8a94a6" }}>
          When active, <strong style={{ color: "#ff6b7f" }}>ALL websites are blocked</strong> except the ones listed below.
          Install the Chrome Extension and click "Start Focus Session" to activate.
        </span>
      </div>

      {/* Tab switch stats */}
      <div className="tab-stats">
        <div className="tab-stat">
          <ArrowLeftRight size={12} />
          <span>{tabSwitchCount} tab switches</span>
        </div>
        <div className="tab-stat">
          <Globe size={12} />
          <span>{formatTime(timeAway)} away</span>
        </div>
      </div>

      {/* Quick presets */}
      <p className="section-label" style={{ marginBottom: 6 }}>Quick Add — Allowed Sites</p>
      <div className="preset-grid">
        {PRESET_ALLOWED.map((site) => (
          <button
            key={site.domain}
            className={`preset-btn ${allowlist.includes(site.domain) ? "preset-btn--allowed" : ""}`}
            onClick={() => togglePreset(site.domain)}
          >
            {allowlist.includes(site.domain) ? <Check size={10} /> : <Plus size={10} />}
            {site.label}
          </button>
        ))}
      </div>

      {/* Current allowlist */}
      <p className="section-label" style={{ marginTop: 14, marginBottom: 6 }}>
        ✅ Allowed Sites ({allowlist.length})
      </p>
      <div className="allowed-list">
        {allowlist.length === 0 ? (
          <div style={{ fontSize: 11, color: "#ff3d5a", padding: 8, textAlign: "center" }}>
            No sites allowed — everything will be blocked during focus!
          </div>
        ) : (
          allowlist.map((domain) => (
            <div key={domain} className="custom-blocked-item" style={{ color: "#00ffc8" }}>
              <span>✅ {domain}</span>
              <button className="icon-btn" onClick={() => removeSite(domain)}>
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Custom add */}
      <div className="blocked-add-row" style={{ marginTop: 10 }}>
        <input
          className="blocked-input"
          type="text"
          placeholder="Add site to allow… e.g. canvas.towson.edu"
          value={newSite}
          onChange={(e) => setNewSite(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSite(newSite)}
        />
        <button className="blocked-add-btn" onClick={() => addSite(newSite)}>
          <Plus size={14} />
        </button>
      </div>

      <p className="blocked-hint">
        These allowed sites sync with the Chrome Extension. Install it, click the FocusLens
        icon, and press "Start Focus Session" to block everything except what's listed above.
      </p>
    </div>
  );
}

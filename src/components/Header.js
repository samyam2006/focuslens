import React from "react";
import { Brain, Play, Pause, RotateCcw, Save } from "lucide-react";

export default function Header({
  tracking,
  cameraActive,
  onStart,
  onPause,
  onReset,
  onSave,
  sessionTime,
}) {
  return (
    <div className="header">
      <div className="header__brand">
        <div className="header__icon">
          <Brain size={22} color="#06060e" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="header__title">FOCUSLENS</h1>
          <p className="header__subtitle">AI-Powered Study Monitor</p>
        </div>
      </div>

      <div className="header__actions">
        {sessionTime > 10 && (
          <button className="header-btn header-btn--save" onClick={onSave}>
            <Save size={14} /> Save Session
          </button>
        )}
        {!tracking ? (
          <button className="header-btn header-btn--primary" onClick={onStart}>
            <Play size={14} /> {cameraActive ? "Resume" : "Start"}
          </button>
        ) : (
          <button className="header-btn header-btn--warn" onClick={onPause}>
            <Pause size={14} /> Pause
          </button>
        )}
        <button className="header-btn header-btn--ghost" onClick={onReset}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

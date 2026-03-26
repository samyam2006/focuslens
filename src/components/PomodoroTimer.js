import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Coffee, Flame } from "lucide-react";
import { formatTime } from "../utils/helpers";

const PHASE_INFO = {
  idle: { label: "Ready", color: "#4a5568", icon: <Flame size={14} /> },
  work: { label: "Focus", color: "#00ffc8", icon: <Flame size={14} /> },
  shortBreak: { label: "Short Break", color: "#ffc400", icon: <Coffee size={14} /> },
  longBreak: { label: "Long Break", color: "#0088ff", icon: <Coffee size={14} /> },
};

export default function PomodoroTimer({
  phase,
  timeLeft,
  round,
  totalPomos,
  isRunning,
  onStart,
  onPause,
  onSkip,
  onReset,
}) {
  const info = PHASE_INFO[phase] || PHASE_INFO.idle;

  // Progress ring
  const totalTime =
    phase === "work" ? 25 * 60 :
    phase === "shortBreak" ? 5 * 60 :
    phase === "longBreak" ? 15 * 60 : 25 * 60;
  const progress = phase === "idle" ? 0 : ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="panel pomo-panel">
      <div className="pomo-header">
        <span className="section-label">Pomodoro Timer</span>
        <div className="pomo-phase-badge" style={{ color: info.color, borderColor: `${info.color}40` }}>
          {info.icon}
          {info.label}
        </div>
      </div>

      <div className="pomo-timer-display">
        {/* Mini progress bar */}
        <div className="pomo-progress-track">
          <div
            className="pomo-progress-fill"
            style={{
              width: `${progress}%`,
              background: info.color,
              boxShadow: `0 0 8px ${info.color}60`,
            }}
          />
        </div>

        <span className="pomo-time" style={{ color: info.color }}>
          {formatTime(timeLeft)}
        </span>

        <div className="pomo-rounds">
          {[1, 2, 3, 4].map((r) => (
            <div
              key={r}
              className="pomo-round-dot"
              style={{
                background: r <= totalPomos % 4 || (totalPomos > 0 && totalPomos % 4 === 0 && r <= 4)
                  ? "#00ffc8"
                  : r === (totalPomos % 4) + 1 && phase === "work"
                  ? `${info.color}40`
                  : "#1a1a2e",
                boxShadow: r <= totalPomos % 4 ? "0 0 4px #00ffc860" : "none",
              }}
            />
          ))}
          <span className="pomo-round-label">Round {round}</span>
        </div>
      </div>

      <div className="pomo-controls">
        {!isRunning ? (
          <button className="pomo-btn pomo-btn--primary" onClick={onStart}>
            <Play size={14} /> {phase === "idle" ? "Start" : "Resume"}
          </button>
        ) : (
          <button className="pomo-btn pomo-btn--warn" onClick={onPause}>
            <Pause size={14} /> Pause
          </button>
        )}
        {phase !== "idle" && (
          <button className="pomo-btn pomo-btn--ghost" onClick={onSkip}>
            <SkipForward size={14} /> Skip
          </button>
        )}
        <button className="pomo-btn pomo-btn--ghost" onClick={onReset}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

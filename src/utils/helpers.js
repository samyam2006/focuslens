/* ── Time formatting ── */
export function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatTimeVerbose(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ── Score → colour ── */
export function scoreToColor(score) {
  if (score >= 70) return "#00ffc8";
  if (score >= 45) return "#ffc400";
  return "#ff3d5a";
}

/* ── Pomodoro defaults ── */
export const POMO_DEFAULTS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
};

/* ── Focus threshold ── */
export const FOCUS_THRESHOLD = 45;
export const DISTRACTION_ALERT_DELAY = 5; // seconds before alert fires

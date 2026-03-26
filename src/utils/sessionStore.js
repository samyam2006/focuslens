const STORAGE_KEY = "focuslens_sessions";
const ALLOWLIST_KEY = "focuslens_allowlist";

/* ── Sessions ── */

export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.push({
    id: Date.now(),
    date: new Date().toISOString(),
    ...session,
  });
  const trimmed = sessions.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Aggregate sessions by day for the last N days.
 */
export function getWeeklyStats(days = 7) {
  const sessions = getSessions();
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const daySessions = sessions.filter((s) => s.date?.startsWith(dateStr));

    const totalFocus = daySessions.reduce((a, s) => a + (s.focusTime || 0), 0);
    const totalSession = daySessions.reduce((a, s) => a + (s.sessionTime || 0), 0);
    const avgScore =
      daySessions.length > 0
        ? Math.round(
            daySessions.reduce((a, s) => a + (s.avgScore || 0), 0) /
              daySessions.length
          )
        : 0;

    result.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      totalFocus: Math.round(totalFocus / 60),
      totalSession: Math.round(totalSession / 60),
      avgScore,
      count: daySessions.length,
    });
  }

  return result;
}

/* ── Allowlist ── */

export function getAllowlist() {
  try {
    const raw = localStorage.getItem(ALLOWLIST_KEY);
    return raw ? JSON.parse(raw) : ["blackboard.towson.edu", "towson.edu"];
  } catch {
    return ["blackboard.towson.edu", "towson.edu"];
  }
}

export function saveAllowlist(list) {
  localStorage.setItem(ALLOWLIST_KEY, JSON.stringify(list));
}

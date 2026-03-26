import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { History, Trash2, Download } from "lucide-react";
import { getWeeklyStats, getSessions, clearSessions } from "../utils/sessionStore";
import { formatTimeVerbose } from "../utils/helpers";

export default function SessionHistory({ refreshKey }) {
  const [weekData, setWeekData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setWeekData(getWeeklyStats(7));
    setSessions(getSessions().slice(-10).reverse());
  }, [refreshKey]);

  const handleClear = () => {
    clearSessions();
    setWeekData(getWeeklyStats(7));
    setSessions([]);
    setShowConfirm(false);
  };

  const handleExport = () => {
    const all = getSessions();
    if (all.length === 0) return;
    const headers = "Date,Duration (min),Focus (min),Distracted (min),Focus %,Avg Score,Tab Switches\n";
    const rows = all.map((s) => {
      const dur = Math.round((s.sessionTime || 0) / 60);
      const foc = Math.round((s.focusTime || 0) / 60);
      const dis = Math.round((s.distractedTime || 0) / 60);
      const pct = s.sessionTime > 0 ? Math.round((s.focusTime / s.sessionTime) * 100) : 0;
      return `${s.date?.split("T")[0]},${dur},${foc},${dis},${pct},${s.avgScore || 0},${s.tabSwitches || 0}`;
    });
    const csv = headers + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "focuslens_sessions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel history-panel">
      <div className="history-header">
        <div className="history-title">
          <History size={14} />
          <span className="section-label" style={{ margin: 0 }}>Weekly Overview</span>
        </div>
        <div className="history-actions">
          <button className="icon-btn" onClick={handleExport} title="Export CSV">
            <Download size={13} />
          </button>
          {!showConfirm ? (
            <button className="icon-btn icon-btn--danger" onClick={() => setShowConfirm(true)} title="Clear history">
              <Trash2 size={13} />
            </button>
          ) : (
            <button className="icon-btn icon-btn--danger" onClick={handleClear}>
              Confirm?
            </button>
          )}
        </div>
      </div>

      {/* Weekly chart */}
      <div style={{ height: 110, marginTop: 8 }}>
        {weekData.every((d) => d.totalFocus === 0) ? (
          <div className="chart-empty">No sessions this week yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barSize={20}>
              <XAxis dataKey="day" tick={{ fill: "#4a5568", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#12121f",
                  border: "1px solid #2a2a40",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
                formatter={(v) => [`${v} min`, "Focus time"]}
              />
              <Bar dataKey="totalFocus" radius={[4, 4, 0, 0]}>
                {weekData.map((entry, i) => (
                  <Cell key={i} fill={entry.totalFocus > 0 ? "#00ffc8" : "#1a1a2e"} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="recent-sessions">
          <p className="section-label" style={{ marginTop: 12, marginBottom: 6 }}>Recent Sessions</p>
          {sessions.slice(0, 5).map((s) => (
            <div key={s.id} className="session-row">
              <span className="session-date">{new Date(s.date).toLocaleDateString()}</span>
              <span className="session-stat">{formatTimeVerbose(s.sessionTime || 0)}</span>
              <span className="session-stat" style={{ color: "#00ffc8" }}>
                {s.sessionTime > 0 ? Math.round(((s.focusTime || 0) / s.sessionTime) * 100) : 0}% focus
              </span>
              <span className="session-stat" style={{ color: "#ff3d5a" }}>
                {s.tabSwitches || 0} switches
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";

export default function StatCard({ icon, label, value, color, small }) {
  return (
    <div className={`stat-card${small ? " stat-card--small" : ""}`}>
      <div className="stat-card__label">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <span className="stat-card__value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

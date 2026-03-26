import React from "react";
import { scoreToColor } from "../utils/helpers";

export default function ScoreRing({ score, size = 140 }) {
  const color = scoreToColor(score);
  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;
  const dashLength = (score / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <p className="section-label" style={{ marginBottom: 8 }}>Focus Score</p>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#1a1a2e" strokeWidth="8"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dashLength} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease",
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        <div className="score-ring__number" style={{ color }}>
          {score}
        </div>
      </div>
    </div>
  );
}

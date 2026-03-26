import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DistractionOverlay({ visible, reason }) {
  if (!visible) return null;

  return (
    <div className="distraction-overlay">
      <div className="distraction-card">
        <AlertTriangle size={32} color="#ff3d5a" />
        <h3>You seem distracted!</h3>
        <p>{reason || "Get back to studying — you've got this."}</p>
      </div>
    </div>
  );
}

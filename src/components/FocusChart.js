import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { Scan } from "lucide-react";

export default function FocusChart({ data }) {
  return (
    <div className="panel chart-panel">
      <p className="section-label">Focus Timeline</p>
      <div style={{ height: 130 }}>
        {data.length < 2 ? (
          <div className="chart-empty">
            <Scan size={14} style={{ marginRight: 6 }} /> Collecting data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ffc8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00ffc8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} hide />
              <ReferenceLine y={45} stroke="#ffc40040" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  background: "#12121f",
                  border: "1px solid #2a2a40",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
                labelFormatter={() => ""}
                formatter={(v) => [`${v}%`, "Focus"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#00ffc8"
                strokeWidth={2}
                fill="url(#focusGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

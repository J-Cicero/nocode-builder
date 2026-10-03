import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function StatsRowSection({ section }) {
  const config = section.config || {};
  const stats = config.stats || [
    { label: "Projects", value: "150" },
    { label: "Users", value: "2.5K" },
    { label: "Revenue", value: "$50M" },
  ];

  return (
    <div
      style={{
        padding: "40px 32px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "24px",
        backgroundColor: COLORS.background,
      }}
    >
      {(Array.isArray(stats) ? stats : []).map((stat, i) => {
        const statObj = typeof stat === "object" ? stat : { label: stat, value: "0" };
        return (
          <div
            key={i}
            style={{
              ...baseStyles.card,
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: COLORS.primary,
                marginBottom: "8px",
              }}
            >
              {statObj.value || "0"}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: COLORS.secondary,
                fontWeight: "500",
              }}
            >
              {statObj.label || "Stat"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

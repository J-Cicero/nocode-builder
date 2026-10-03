import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function BottomNavSection({ section }) {
  const items = section.config?.items || [
    { label: "Home", icon: "🏠" },
    { label: "Search", icon: "🔍" },
    { label: "Add", icon: "➕" },
    { label: "Messages", icon: "💬" },
    { label: "Profile", icon: "👤" },
  ];

  return (
    <div
      style={{
        backgroundColor: COLORS.white,
        borderTop: `1px solid ${COLORS.cardBorder}`,
        padding: "0",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        height: "60px",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: COLORS.secondary,
            fontSize: "12px",
            fontWeight: "500",
            gap: "4px",
          }}
        >
          <div style={{ fontSize: "20px" }}>{item.icon}</div>
          <div>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

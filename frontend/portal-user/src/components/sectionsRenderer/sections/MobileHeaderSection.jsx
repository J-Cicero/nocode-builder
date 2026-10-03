import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function MobileHeaderSection({ section }) {
  const title = section.config?.title || "App Title";
  const subtitle = section.config?.subtitle || "Subtitle";

  return (
    <div
      style={{
        backgroundColor: COLORS.darkNav,
        padding: "16px 12px",
        color: COLORS.white,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          margin: "0",
          marginBottom: "4px",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: "12px",
            margin: "0",
            opacity: 0.8,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

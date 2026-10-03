import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function TextSection({ section }) {
  const title = section.config?.title || "Section Title";
  const content = section.config?.content || "Your content goes here";

  return (
    <div
      style={{
        padding: "40px 32px",
        backgroundColor: COLORS.background,
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: COLORS.dark,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            color: COLORS.secondary,
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}

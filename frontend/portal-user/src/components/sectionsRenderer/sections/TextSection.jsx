import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function TextSection({ section }) {
  const config = section.config || {};
  const styles = section.styles || {};
  const title = config.title || section.title || "Section Title";
  const content = config.content || "Your content goes here";

  return (
    <div
      style={{
        padding: styles.padding || "40px 32px",
        backgroundColor: styles.backgroundColor || COLORS.background,
        textAlign: styles.textAlign || "left",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <div style={{ maxWidth: "800px", margin: styles.textAlign === "center" ? "0 auto" : "0" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: styles.color || COLORS.dark,
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

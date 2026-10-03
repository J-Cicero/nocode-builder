import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function HeroSection({ section }) {
  const title = section.config?.title || "Welcome to Our Platform";
  const subtitle =
    section.config?.subtitle || "Build amazing things with no code";
  const ctaText = section.config?.ctaText || "Get Started";

  return (
    <div
      style={{
        backgroundColor: COLORS.darkNav,
        padding: "80px 40px",
        textAlign: "center",
        color: COLORS.white,
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          marginBottom: "16px",
          color: COLORS.white,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "20px",
          marginBottom: "32px",
          color: COLORS.white,
          opacity: 0.9,
        }}
      >
        {subtitle}
      </p>
      <button
        style={{
          ...baseStyles.button,
          fontSize: "16px",
        }}
      >
        {ctaText}
      </button>
    </div>
  );
}

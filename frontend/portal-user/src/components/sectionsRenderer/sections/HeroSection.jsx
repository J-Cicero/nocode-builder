import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function HeroSection({ section }) {
  const config = section.config || {};
  const styles = section.styles || {};
  const title = config.title || section.title || "Welcome to Our Platform";
  const subtitle = config.subtitle || "Build amazing things with no code";
  const ctaText = config.ctaText || config.buttonText || "Get Started";

  return (
    <div
      style={{
        backgroundColor: styles.backgroundColor || COLORS.darkNav,
        padding: styles.padding || "80px 40px",
        textAlign: styles.textAlign || "center",
        color: styles.color || COLORS.white,
        transition: "all 0.2s ease-in-out",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          marginBottom: "16px",
          color: styles.color || COLORS.white,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "20px",
          marginBottom: "32px",
          color: styles.color || COLORS.white,
          opacity: 0.9,
        }}
      >
        {subtitle}
      </p>
      <button
        style={{
          ...baseStyles.button,
          fontSize: "16px",
          backgroundColor: styles.buttonColor || COLORS.primary,
        }}
      >
        {ctaText}
      </button>
    </div>
  );
}

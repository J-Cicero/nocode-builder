import React from "react";
import { COLORS } from "../designSystem";

export default function NavbarSection({ section }) {
  const config = section.config || {};
  const links = config.links || ["Home", "About", "Services", "Contact"];
  const title = section.title || config.title || "Logo";

  return (
    <nav
      style={{
        backgroundColor: COLORS.darkNav,
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: COLORS.white,
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        {(Array.isArray(links) ? links : []).map((link, i) => (
          <a
            key={i}
            href={typeof link === "object" ? link.path || "#" : "#"}
            style={{
              color: COLORS.white,
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {typeof link === "object" ? link.label || link.path : link}
          </a>
        ))}
      </div>
    </nav>
  );
}

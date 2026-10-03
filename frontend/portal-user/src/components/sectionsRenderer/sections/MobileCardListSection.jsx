import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function MobileCardListSection({ section, connectionData }) {
  const config = section.config || {};
  const items = connectionData || config.items || [
    { title: "Item 1", description: "Description 1" },
    { title: "Item 2", description: "Description 2" },
    { title: "Item 3", description: "Description 3" },
  ];

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {(Array.isArray(items) ? items : Object.values(items || {})).map(
        (item, i) => {
          const itemObj = typeof item === "object" ? item : { title: item };
          return (
            <div
              key={i}
              style={{
                ...baseStyles.card,
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: COLORS.primary,
                  borderRadius: RADIUS.sm,
                }}
              ></div>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: "0 0 4px 0",
                    color: COLORS.dark,
                  }}
                >
                  {itemObj.title || itemObj.name || "Item"}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    margin: "0",
                    color: COLORS.secondary,
                  }}
                >
                  {itemObj.description || ""}
                </p>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

import React from "react";
import { COLORS, RADIUS, baseStyles } from "../designSystem";

export default function DataTableSection({ section, connectionData }) {
  const config = section.config || {};
  const styles = section.styles || {};
  const headers = config.headers || ["ID", "Name", "Email", "Status"];
  const rows = connectionData || config.rows || [
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive" },
  ];

  return (
    <div
      style={{
        padding: styles.padding || "24px 32px",
        backgroundColor: styles.backgroundColor || COLORS.background,
        overflowX: "auto",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {(section.title || config.title) && (
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: styles.color || COLORS.dark, marginBottom: "16px" }}>
          {config.title || section.title}
        </h2>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: COLORS.white,
          borderRadius: RADIUS.md,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: COLORS.background,
              borderBottom: `2px solid ${COLORS.cardBorder}`,
            }}
          >
            {headers.map((header, i) => (
              <th
                key={i}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: COLORS.dark,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(rows) ? rows : Object.values(rows)).map(
            (row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${COLORS.cardBorder}`,
                }}
              >
                {headers.map((header, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: COLORS.dark,
                    }}
                  >
                    {row[header.toLowerCase()] || row[header] || "-"}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

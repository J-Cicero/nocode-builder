import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import SectionRenderer from "../SectionRenderer/SectionRenderer";

/**
 * Rend une Page et ses sections.
 * Ne connaît pas le Blueprint — uniquement la page.
 * 
 * @param {{ page: import('../../../types/blueprint').Page }} props
 */
export default function PageViewport({ page }) {
  const { selectedPageId, selectPage } = useSelection();
  const isSelected = selectedPageId === page.uuid;

  const sortedSections = [...(page.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectPage(page.uuid); }}
      data-page-uuid={page.uuid}
      style={{
        background: "#FFFFFF",
        border: isSelected ? "2px solid #6366f1" : "2px solid #E2E8F0",
        borderRadius: "8px",
        overflow: "hidden",
        minHeight: "400px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "border-color 0.15s ease",
      }}
    >
      {/* En-tête de page */}
      <div style={{
        background: isSelected ? "#EEF2FF" : "#F8FAFC",
        borderBottom: "1px solid #E2E8F0",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background 0.15s ease",
      }}>
        <span style={{ fontSize: "14px" }}>{page.icon ?? "📄"}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{page.name}</span>
        <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>{page.path}</span>
      </div>

      {/* Corps de la page — sections */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sortedSections.map((section) => (
          <SectionRenderer key={section.uuid} section={section} />
        ))}
        {sortedSections.length === 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "200px", color: "#CBD5E1", fontSize: "13px",
            flexDirection: "column", gap: "8px",
          }}>
            <span style={{ fontSize: "32px" }}>🧩</span>
            Page sans sections
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import ComponentRenderer from "../ComponentRenderer/ComponentRenderer";

/**
 * Rend une Section et ses composants.
 * Ne connaît pas les pages — uniquement les sections.
 * 
 * @param {{ section: import('../../../types/blueprint').Section }} props
 */
export default function SectionRenderer({ section }) {
  const { selectedSectionId, selectSection } = useSelection();
  const isSelected = selectedSectionId === section.uuid;

  const sortedComponents = [...(section.components ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sectionStyles = {
    hero: { minHeight: "240px", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", padding: "48px 24px" },
    header: { background: "#1E293B", padding: "12px 24px" },
    footer: { background: "#F8FAFC", padding: "24px", borderTop: "1px solid #E2E8F0" },
    content: { background: "#FFFFFF", padding: "32px 24px" },
    sidebar: { background: "#F1F5F9", padding: "16px", minHeight: "300px" },
    grid: { background: "#FFFFFF", padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
    form: { background: "#FFFFFF", padding: "32px 24px" },
  };

  const baseStyle = sectionStyles[section.type] ?? { background: "#FFFFFF", padding: "16px" };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectSection(section.uuid); }}
      data-section-uuid={section.uuid}
      style={{
        ...baseStyle,
        position: "relative",
        outline: isSelected ? "2px solid #818CF8" : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        borderRadius: "4px",
      }}
    >
      {/* Label de type de section */}
      <div style={{
        position: "absolute", top: "4px", left: "8px",
        fontSize: "10px", fontWeight: 600, color: "#94A3B8",
        textTransform: "uppercase", letterSpacing: "0.05em",
        pointerEvents: "none",
      }}>
        {section.type}
      </div>

      {/* Rendu des composants */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        {sortedComponents.map((component) => (
          <ComponentRenderer key={component.uuid} component={component} />
        ))}
        {sortedComponents.length === 0 && (
          <div style={{ color: "#CBD5E1", fontSize: "12px", textAlign: "center", padding: "16px" }}>
            Section vide — ajoutez des composants
          </div>
        )}
      </div>
    </div>
  );
}

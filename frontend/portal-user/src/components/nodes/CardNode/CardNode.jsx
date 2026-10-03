import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import ComponentRenderer from "../../editor/ComponentRenderer/ComponentRenderer";
import { COLORS, RADIUS, getComponentTokenStyle } from "../../sectionsRenderer/designSystem";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function CardNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const { variant = "default" } = component.props ?? {};
  const styles = component.styles ?? {};

  const tokenStyle = getComponentTokenStyle("card", { variant }, styles);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        backgroundColor: styles.backgroundColor ?? tokenStyle.backgroundColor ?? COLORS.cardBg,
        borderRadius: styles.borderRadius ?? tokenStyle.borderRadius ?? RADIUS.md,
        border: styles.border ?? tokenStyle.border ?? `1px solid ${COLORS.cardBorder}`,
        padding: styles.padding ?? "16px",
        margin: styles.margin ?? "0",
        width: styles.width ?? "100%",
        boxShadow: styles.boxShadow ?? tokenStyle.boxShadow ?? "0 1px 3px rgba(44, 26, 14, 0.08)",
        outline: isSelected ? `2px solid ${COLORS.focusRing}` : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {(component.children ?? []).map((child) => (
        <ComponentRenderer key={child.uuid} component={child} />
      ))}
    </div>
  );
}


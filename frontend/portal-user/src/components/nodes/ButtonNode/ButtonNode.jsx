import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import { COLORS, RADIUS, getComponentTokenStyle } from "../../sectionsRenderer/designSystem";

/**
 * @param {{ component: import('../../../types/blueprint').Component }} props
 */
export default function ButtonNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;

  const { label = "Bouton", disabled = false, href, variant } = component.props ?? {};
  const styles = component.styles ?? {};

  const tokenStyle = getComponentTokenStyle("button", { variant }, styles);

  const handleClick = (e) => {
    e.stopPropagation();
    selectComponent(component.uuid);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      data-component-uuid={component.uuid}
      style={{
        padding: styles.padding ?? "8px 16px",
        backgroundColor: styles.backgroundColor ?? tokenStyle.backgroundColor ?? COLORS.primary,
        color: styles.color ?? tokenStyle.color ?? COLORS.white,
        fontSize: styles.fontSize ?? "14px",
        fontWeight: styles.fontWeight ?? "600",
        borderRadius: styles.borderRadius ?? RADIUS.sm,
        border: styles.border ?? tokenStyle.border ?? "none",
        margin: styles.margin ?? "0",
        width: styles.width ?? "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        outline: isSelected ? `2px solid ${COLORS.focusRing}` : "none",
        outlineOffset: "2px",
        transition: "outline 0.1s ease, all 0.2s ease",
      }}
    >
      {href ? <a href={href} style={{ color: "inherit", textDecoration: "none" }}>{label}</a> : label}
    </button>
  );
}


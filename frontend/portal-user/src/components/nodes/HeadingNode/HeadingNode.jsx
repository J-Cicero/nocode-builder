import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import { COLORS } from "../../sectionsRenderer/designSystem";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function HeadingNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const { label = "Titre", htmlType = "h2" } = component.props ?? {};
  const styles = component.styles ?? {};

  const Tag = ["h1","h2","h3","h4","h5","h6"].includes(htmlType) ? htmlType : "h2";

  return (
    <Tag
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        color: styles.color ?? COLORS.dark,
        fontSize: styles.fontSize ?? (Tag === "h1" ? "32px" : Tag === "h2" ? "24px" : "18px"),
        fontWeight: styles.fontWeight ?? "700",
        margin: styles.margin ?? "0 0 8px 0",
        padding: styles.padding ?? "0",
        textAlign: styles.textAlign ?? "left",
        outline: isSelected ? `2px solid ${COLORS.focusRing}` : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        borderRadius: "4px",
      }}
    >
      {label}
    </Tag>
  );
}


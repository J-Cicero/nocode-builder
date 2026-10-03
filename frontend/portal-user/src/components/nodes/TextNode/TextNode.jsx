import React from "react";
import { useSelection } from "../../../context/SelectionContext";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function TextNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const { label = "Texte" } = component.props ?? {};
  const styles = component.styles ?? {};

  return (
    <p
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        color: styles.color ?? "#374151",
        fontSize: styles.fontSize ?? "14px",
        fontWeight: styles.fontWeight ?? "400",
        margin: styles.margin ?? "0",
        padding: styles.padding ?? "0",
        textAlign: styles.textAlign ?? "left",
        outline: isSelected ? "2px solid #6366f1" : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        borderRadius: "4px",
      }}
    >
      {label}
    </p>
  );
}

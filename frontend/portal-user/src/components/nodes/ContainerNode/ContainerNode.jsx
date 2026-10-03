import React from "react";
import { useSelection } from "../../../context/SelectionContext";
import ComponentRenderer from "../../editor/ComponentRenderer/ComponentRenderer";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function ContainerNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const styles = component.styles ?? {};

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        backgroundColor: styles.backgroundColor ?? "transparent",
        padding: styles.padding ?? "8px",
        margin: styles.margin ?? "0",
        width: styles.width ?? "100%",
        borderRadius: styles.borderRadius ?? "0",
        border: styles.border ?? "1px dashed #CBD5E1",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "48px",
        outline: isSelected ? "2px solid #6366f1" : "none",
        outlineOffset: "2px",
        cursor: "pointer",
      }}
    >
      {(component.children ?? []).map((child) => (
        <ComponentRenderer key={child.uuid} component={child} />
      ))}
      {(component.children ?? []).length === 0 && (
        <span style={{ color: "#94A3B8", fontSize: "12px", textAlign: "center", padding: "8px" }}>
          Conteneur vide
        </span>
      )}
    </div>
  );
}

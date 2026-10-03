import React from "react";
import { useSelection } from "../../../context/SelectionContext";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function InputNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const { placeholder = "Saisir...", htmlType = "text", disabled = false, value = "" } = component.props ?? {};
  const styles = component.styles ?? {};

  return (
    <input
      type={htmlType}
      placeholder={placeholder}
      defaultValue={value}
      disabled={disabled}
      readOnly
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        padding: styles.padding ?? "8px 12px",
        border: styles.border ?? "1px solid #D1D5DB",
        borderRadius: styles.borderRadius ?? "6px",
        fontSize: styles.fontSize ?? "14px",
        color: styles.color ?? "#374151",
        backgroundColor: styles.backgroundColor ?? "#FFFFFF",
        width: styles.width ?? "100%",
        margin: styles.margin ?? "0",
        outline: isSelected ? "2px solid #6366f1" : "none",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    />
  );
}

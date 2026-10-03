import React from "react";
import { useSelection } from "../../../context/SelectionContext";

/** @param {{ component: import('../../../types/blueprint').Component }} props */
export default function ImageNode({ component }) {
  const { selectedComponentId, selectComponent } = useSelection();
  const isSelected = selectedComponentId === component.uuid;
  const { src = "", alt = "Image" } = component.props ?? {};
  const styles = component.styles ?? {};

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectComponent(component.uuid); }}
      data-component-uuid={component.uuid}
      style={{
        width: styles.width ?? "100%",
        margin: styles.margin ?? "0",
        padding: styles.padding ?? "0",
        outline: isSelected ? "2px solid #6366f1" : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        borderRadius: styles.borderRadius ?? "0",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: styles.height ?? "auto", objectFit: "cover", display: "block", borderRadius: "inherit" }}
        />
      ) : (
        <div style={{
          width: "100%",
          height: styles.height ?? "120px",
          backgroundColor: "#E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "inherit",
          color: "#94A3B8",
          fontSize: "13px",
        }}>
          🖼️ Image
        </div>
      )}
    </div>
  );
}

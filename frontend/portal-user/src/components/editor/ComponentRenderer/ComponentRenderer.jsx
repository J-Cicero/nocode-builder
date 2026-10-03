import React from "react";
import { resolveComponent } from "../../../registry/componentRegistry";

/**
 * Résout et rend un composant Blueprint depuis le registre.
 * Ne connaît pas les sections ni les pages — uniquement les composants.
 * 
 * @param {{ component: import('../../../types/blueprint').Component }} props
 */
export default function ComponentRenderer({ component }) {
  const NodeComponent = resolveComponent(component.type);

  if (!NodeComponent) {
    return (
      <div
        style={{
          padding: "8px",
          background: "#FEF2F2",
          border: "1px dashed #F87171",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#EF4444",
        }}
      >
        Composant inconnu : <strong>{component.type}</strong>
      </div>
    );
  }

  return <NodeComponent component={component} />;
}

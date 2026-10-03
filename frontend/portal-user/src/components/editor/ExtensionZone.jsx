// src/components/editor/ExtensionZone.jsx
import React from "react";

/**
 * Zone d'extension en bas de l'éditeur
 * Zone sans React Flow pour des outils supplémentaires ou propriétés avancées
 */
export default function ExtensionZone() {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        padding: "20px",
        overflow: "auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: "14px",
          padding: "40px 0",
        }}
      >
        <div style={{ marginBottom: "8px", fontWeight: "500" }}>
          Zone d'extension
        </div>
        <div>
          Cette zone peut contenir des outils supplémentaires,
          des propriétés avancées ou d'autres fonctionnalités.
        </div>
        <div style={{ marginTop: "12px", fontSize: "12px" }}>
          ℹ️ Les composants ne peuvent pas être déposés dans cette zone
        </div>
      </div>
    </div>
  );
}

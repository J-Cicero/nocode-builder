import React from "react";
import { useBlueprint } from "../../../context/BlueprintContext";

/**
 * Barre d'outils supérieure de l'éditeur Blueprint.
 * Affiche le nom du projet, le statut de sauvegarde, et le bouton de sauvegarde manuelle.
 */
export default function Toolbar() {
  const { blueprint, dirty, saving, saveBlueprint } = useBlueprint();

  const projectName = blueprint?.content?.metadata?.title ?? "Blueprint sans titre";
  const version = blueprint?.version ?? "—";

  return (
    <div style={{
      height: "48px",
      background: "#1E293B",
      borderBottom: "1px solid #334155",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: "16px",
      flexShrink: 0,
    }}>
      {/* Logo / Identité */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>🧱</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>NoCode Builder</span>
      </div>

      <div style={{ width: "1px", height: "20px", background: "#334155" }} />

      {/* Nom du projet */}
      <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>
        {projectName}
      </span>

      <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
        v{version}
      </span>

      <div style={{ flex: 1 }} />

      {/* Indicateur de statut */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {saving ? (
          <>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Sauvegarde...</span>
          </>
        ) : dirty ? (
          <>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316" }} />
            <span style={{ fontSize: "12px", color: "#F97316" }}>Modifié</span>
          </>
        ) : (
          <>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Sauvegardé</span>
          </>
        )}
      </div>

      {/* Bouton sauvegarde manuelle */}
      <button
        onClick={saveBlueprint}
        disabled={!dirty || saving}
        style={{
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "6px",
          border: "none",
          cursor: (!dirty || saving) ? "not-allowed" : "pointer",
          background: (!dirty || saving) ? "#334155" : "#6366f1",
          color: (!dirty || saving) ? "#64748B" : "#FFFFFF",
          transition: "background 0.15s ease",
        }}
      >
        {saving ? "..." : "Sauvegarder"}
      </button>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

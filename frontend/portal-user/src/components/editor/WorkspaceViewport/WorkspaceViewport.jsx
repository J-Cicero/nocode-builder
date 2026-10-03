import React from "react";
import { useBlueprint } from "../../../context/BlueprintContext";
import PageViewport from "../PageViewport/PageViewport";

/**
 * Viewport principal de l'éditeur.
 * Lit le Blueprint depuis le contexte et rend toutes les pages.
 * Ne sait pas qui est sélectionné — délègue à PageViewport.
 */
export default function WorkspaceViewport() {
  const { blueprint, loading, error } = useBlueprint();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          border: "3px solid #E2E8F0", borderTopColor: "#6366f1",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ color: "#6B7280", fontSize: "14px" }}>Chargement du Blueprint...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "32px" }}>⚠️</span>
        <span style={{ color: "#EF4444", fontSize: "14px", fontWeight: 600 }}>Erreur</span>
        <span style={{ color: "#6B7280", fontSize: "13px" }}>{error}</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94A3B8", fontSize: "14px" }}>
        Aucun Blueprint chargé
      </div>
    );
  }

  const pages = blueprint.content?.pages ?? [];

  return (
    <div style={{
      height: "100%",
      overflowY: "auto",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      background: "#F1F5F9",
      backgroundImage: "linear-gradient(rgba(203,213,225,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(203,213,225,0.3) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}>
      {pages.length === 0 ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "400px", flexDirection: "column", gap: "12px",
          color: "#94A3B8",
        }}>
          <span style={{ fontSize: "48px" }}>📋</span>
          <span style={{ fontSize: "16px", fontWeight: 600 }}>Blueprint sans pages</span>
          <span style={{ fontSize: "13px" }}>Ajoutez une page depuis la sidebar</span>
        </div>
      ) : (
        pages.map((page) => (
          <PageViewport key={page.uuid} page={page} />
        ))
      )}
    </div>
  );
}

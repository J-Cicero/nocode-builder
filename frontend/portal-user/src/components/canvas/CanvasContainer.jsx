// src/components/canvas/CanvasContainer.jsx
import React from "react";
import WorkspaceViewport from "./WorkspaceViewport";

/**
 * Conteneur du Canvas sans ReactFlow - simplement scrollable
 * Contient les pages individuelles qui ont leur propre ReactFlow
 */
export default function CanvasContainer({ canvasHeight, pages, projectId, refreshInterface, createPage }) {
  const handleDragOver = (event) => {
    event.preventDefault(); // Nécessaire pour autoriser le drop
  };

  return (
    <div
      onDragOver={handleDragOver}
      style={{
        height: canvasHeight,
        width: "100%",
        position: "relative",
        backgroundColor: "#f1f5f9", // Couleur de fond canvas (gris clair)
        overflow: "auto", // Permet le scroll horizontal et vertical
        // Grille de fond pour l'espace de travail global
        backgroundImage: `
          linear-gradient(rgba(203, 213, 225, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(203, 213, 225, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    >
      {/* Contenu scrollable avec les pages canvas */}
      <div
        style={{
          minWidth: "3000px", // Largeur minimale pour permettre le scroll horizontal
          minHeight: "2000px", // Hauteur minimale pour permettre le scroll vertical
          position: "relative",
        }}
      >
        {/* Pages canvas individuelles avec leur propre ReactFlow */}
        {pages.map((page, index) => (
          <WorkspaceViewport 
            key={page.tracking_id} 
            page={page} 
            index={index} 
            projectId={projectId} 
            refreshInterface={refreshInterface}
          />
        ))}

        {pages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
             <div className="text-[#7A5C44] text-lg font-medium">Aucune page dans ce projet</div>
             <button
               onClick={() => createPage({ nom: 'Ma première page', slug: 'premiere-page' })}
               className="px-6 py-2 bg-[#C4622D] text-white rounded-lg font-bold shadow-md hover:bg-[#A04E22] transition-colors"
             >
               Créer ma première page
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

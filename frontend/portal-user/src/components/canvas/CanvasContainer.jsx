// src/components/canvas/CanvasContainer.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus } from "lucide-react";
import WorkspaceViewport from "./WorkspaceViewport";

/**
 * Conteneur du Canvas sans ReactFlow - simplement scrollable
 * Contient les pages individuelles qui ont leur propre ReactFlow
 */
export default function CanvasContainer({ canvasHeight, pages, projectId, refreshInterface, createPage }) {
  const navigate = useNavigate();
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
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 p-6 text-center">
             <div className="w-16 h-16 rounded-3xl bg-[#FFF0E8] flex items-center justify-center text-[#C4622D] shadow-inner mb-2">
                <Sparkles size={32} />
             </div>
             <h3 className="text-xl font-serif font-bold text-[#1A0E0A]">Construisez votre interface</h3>
             <p className="text-sm text-[#7A5C44] max-w-md mb-2">
               Choisissez comment vous souhaitez concevoir l'écran de votre application :
             </p>
             <div className="flex flex-wrap items-center justify-center gap-3">
               <button
                 onClick={() => createPage({ nom: 'Accueil', chemin: '/', type_page: 'desktop', est_accueil: true })}
                 className="px-5 py-2.5 bg-[#C4622D] text-white rounded-xl font-bold shadow-md hover:bg-[#A04E22] transition-all flex items-center gap-2 text-sm"
               >
                 <Plus size={16} />
                 Créer une page vierge
               </button>
               <button
                 onClick={() => navigate('/templates')}
                 className="px-5 py-2.5 bg-white border border-[#E8D9C4] text-[#7A5C44] hover:border-[#C4622D] hover:text-[#C4622D] rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 text-sm"
               >
                 <Sparkles size={16} className="text-[#C4622D]" />
                 Choisir un modèle prêt à l'emploi
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

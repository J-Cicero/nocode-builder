import React, { useState, useEffect, useRef } from "react";
import SideBarComponents from "../canvas/sideBars/SideBarComponents";
import SideBarModifications from "../canvas/sideBars/SideBarModifications";
import EditorHeader from "./EditorHeader";
import CanvasContainer from "../canvas/CanvasContainer";
import { useInterface } from "../../hooks/useInterface";
import { useProjects } from "../../store/projectStore";

/**
 * Layout principal de l'éditeur avec structure modulaire
 * Canvas redimensionnable verticalement avec navigation libre (zoom/déplacement)
 */
export default function EditorLayout({ projectId }) {
  const { pages, loading, error, hydrate, createPage, deletePage, updateSection, deleteSection } = useInterface(projectId);
  const { setCurrentProject, projects } = useProjects();
  
  // État pour la hauteur du canvas (hauteur flexible de la page)
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 80); // Hauteur totale - header
  const sectionRef = useRef(null);

  // Mise à jour de la hauteur du canvas lors du resize de la fenêtre
  useEffect(() => {
    const handleWindowResize = () => {
      setCanvasHeight(window.innerHeight - 80); // 80px pour le header
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Update current project
  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const proj = projects.find(p => p.tracking_id === projectId);
      if (proj) setCurrentProject(proj);
    }
  }, [projects, projectId, setCurrentProject]);

  if (loading && !pages.length) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FBF4E9]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#C4622D]"></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Sidebar gauche pour les composants */}
      <SideBarComponents 
        pages={pages} 
        createPage={createPage} 
        deletePage={deletePage} 
      />

      {/* Zone principale de l'éditeur */}
      <section
        ref={sectionRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Header de l'éditeur - Zone SANS React Flow */}
        <EditorHeader />

        {/* Canvas - Zone AVEC React Flow (pleine hauteur) */}
        <CanvasContainer 
          canvasHeight={canvasHeight} 
          pages={pages} 
          projectId={projectId} 
          refreshInterface={hydrate}
          createPage={createPage}
        />
      </section>

      {/* Sidebar droite pour les modifications */}
      <SideBarModifications pages={pages} updateSection={updateSection} deleteSection={deleteSection} />
    </div>
  );
}

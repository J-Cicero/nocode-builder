import React, { useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { BaseSelectionProvider } from "../selection";
import EditorHeader from "../components/editor/EditorHeader";
import { useParams } from "react-router-dom";
import { useProjects } from "../store/projectStore";
import { useInterface } from "../hooks/useInterface";
// Views
import DataView from "../components/workspace/DataView";
import LogicView from "../components/workspace/LogicView";
import SideBarComponents from "../components/canvas/sideBars/SideBarComponents";
import SideBarModifications from "../components/canvas/sideBars/SideBarModifications";
import CanvasContainer from "../components/canvas/CanvasContainer";
import EnoCGuide from "../components/workspace/EnoCGuide";

function WorkspaceContent() {
  const { projectId } = useParams();
  const { currentProject, setCurrentProject, projects, activeView } = useProjects();
  const { pages, loading, hydrate, createPage, deletePage } = useInterface(projectId);

  // Sync project
  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const proj = projects.find(p => p.tracking_id === projectId);
      if (proj) setCurrentProject(proj);
    }
  }, [projects, projectId, setCurrentProject]);

  // Global listener for AI updates
  useEffect(() => {
    const handleRefresh = () => {
      console.log("🪄 IA a modifié l'interface, rechargement...");
      hydrate();
    };
    window.addEventListener('enoc:refresh-editor', handleRefresh);
    return () => window.removeEventListener('enoc:refresh-editor', handleRefresh);
  }, [hydrate]);

  if (loading && !pages.length) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FBF4E9]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#C4622D]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Universal Header */}
      <EditorHeader />

      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW: INTERFACE */}
        {activeView === "interface" && (
          <div key="view-interface" className="flex-1 flex overflow-hidden">
            <SideBarComponents pages={pages} createPage={createPage} deletePage={deletePage} />
            <section className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
              <CanvasContainer 
                canvasHeight="100%" 
                pages={pages} 
                projectId={projectId} 
                refreshInterface={hydrate} 
                createPage={createPage}
              />
            </section>
            <SideBarModifications />
          </div>
        )}

        {/* VIEW: DATA */}
        {activeView === "data" && <DataView key="view-data" />}

        {/* VIEW: LOGIC */}
        {activeView === "logic" && <LogicView key="view-logic" />}
        
        {/* Floating AI Assistant (Always present in workspace) */}
        <EnoCGuide />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <BaseSelectionProvider>
      <WorkspaceContent />
    </BaseSelectionProvider>
  );
}

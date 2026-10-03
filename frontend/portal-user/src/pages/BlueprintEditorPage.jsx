import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BlueprintProvider, useBlueprint } from "../context/BlueprintContext";
import { SelectionProvider } from "../context/SelectionContext";
import WorkspaceViewport from "../components/editor/WorkspaceViewport/WorkspaceViewport";
import Sidebar from "../components/editor/Sidebar/Sidebar";
import Toolbar from "../components/editor/Toolbar/Toolbar";
import useAutosave from "../hooks/useAutosave";

/**
 * Contenu interne de l'éditeur Blueprint.
 * Doit être enfant de BlueprintProvider et SelectionProvider.
 */
function BlueprintEditorContent() {
  const { blueprintUuid } = useParams();
  const { loadBlueprint, blueprint } = useBlueprint();

  // Active l'autosave
  useAutosave();

  // Charge le Blueprint au montage
  useEffect(() => {
    if (blueprintUuid) {
      loadBlueprint(blueprintUuid);
    }
  }, [blueprintUuid, loadBlueprint]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Barre d'outils */}
      <Toolbar />

      {/* Corps de l'éditeur */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas central */}
        <main style={{ flex: 1, overflow: "hidden" }}>
          <WorkspaceViewport />
        </main>

        {/* Sidebar droite */}
        <Sidebar />
      </div>
    </div>
  );
}

/**
 * Page principale de l'éditeur Blueprint V1.
 * Route : /app/blueprint/:blueprintUuid
 * 
 * Fournit les contextes Blueprint et Selection à toute la hiérarchie.
 */
export default function BlueprintEditorPage() {
  return (
    <BlueprintProvider>
      <SelectionProvider>
        <BlueprintEditorContent />
      </SelectionProvider>
    </BlueprintProvider>
  );
}

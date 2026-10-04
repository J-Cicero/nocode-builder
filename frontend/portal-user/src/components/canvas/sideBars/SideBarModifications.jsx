import React, { useState } from "react";
import PositionPart from "./sideBarModificationsParts/PositionPart";
import LayoutPart from "./sideBarModificationsParts/LayoutPart";
import AppearancePart from "./sideBarModificationsParts/AppearancePart";
import ColorPart from "./sideBarModificationsParts/ColorPart";
import InformationPart from "./sideBarModificationsParts/InformationPart";
import DataBindingPart from "./sideBarModificationsParts/DataBindingPart";
import ActionPart from "./sideBarModificationsParts/ActionPart";
import SectionInspector from "./SectionInspector";
import { PanelRightClose, PanelLeftClose, MousePointerClick, Sparkles } from "lucide-react";
import { useSelection } from "../../../context/SelectionContext";
import { useSelectedNode } from "../../../selection";

export default function SideBarModifications({ pages = [], updateSection, deleteSection }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedSectionId, clearSelection } = useSelection();
  const { selectedNodeId } = useSelectedNode();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Trouver la section sélectionnée
  const selectedSection = (pages || [])
    .flatMap((p) => p.sections || [])
    .find((s) => s.tracking_id === selectedSectionId);

  const selectedPage = (pages || []).find((p) =>
    (p.sections || []).some((s) => s.tracking_id === selectedSectionId)
  );

  return (
    <aside
      className={`${
        isCollapsed ? "w-12" : "w-[340px]"
      } border-l border-gray-200 bg-white h-screen overflow-y-auto transition-all duration-300 ease-in-out relative flex flex-col z-20 shadow-sm`}
    >
      {/* Bouton pour cacher/afficher la sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors z-30"
        title={isCollapsed ? "Afficher le panneau" : "Masquer le panneau"}
      >
        {isCollapsed ? (
          <PanelLeftClose className="w-5 h-5 text-gray-500 hover:text-[#C4622D]" />
        ) : (
          <PanelRightClose className="w-5 h-5 text-gray-500 hover:text-[#C4622D]" />
        )}
      </button>

      {/* Contenu de la sidebar - affiché seulement si non collapsed */}
      {!isCollapsed && (
        <div className="p-4 pt-14 flex-1">
          {/* Titre du panneau */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#1A0E0A] flex items-center gap-2">
                <Sparkles size={16} className="text-[#C4622D]" />
                Palette & Inspecteur
              </h2>
              <p className="text-xs text-gray-500">
                Personnalisation visuelle en direct
              </p>
            </div>
          </div>

          {/* CAS 1 : Section sélectionnée (Mode Moderne EnoC) */}
          {selectedSection ? (
            <SectionInspector
              section={selectedSection}
              page={selectedPage}
              onUpdate={updateSection}
              onDelete={deleteSection}
              onClose={clearSelection}
            />
          ) : selectedNodeId ? (
            /* CAS 2 : Nœud ReactFlow sélectionné */
            <div>
              <InformationPart />
              <DataBindingPart />
              <ActionPart />
              <PositionPart />
              <LayoutPart />
              <AppearancePart />
              <ColorPart />
            </div>
          ) : (
            /* CAS 3 : Aucun élément sélectionné */
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-14 h-14 mx-auto bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-[#C4622D]">
                <MousePointerClick size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1A0E0A]">
                  Aucune section sélectionnée
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[240px] mx-auto">
                  Cliquez sur n'importe quelle section sur le canvas pour modifier ses textes, ses couleurs, ses boutons et son ordre.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 text-left space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Ce que vous pouvez modifier :
                </span>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                  <li>Titres, sous-titres et descriptions</li>
                  <li>Couleurs de fond et de texte</li>
                  <li>Libellés et liens des boutons CTA</li>
                  <li>Ordre vertical des sections</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Icône réduite quand la sidebar est collapsed */}
      {isCollapsed && (
        <div className="pt-16 flex flex-col items-center gap-3">
          <Sparkles size={18} className="text-[#C4622D]" />
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            Inspecteur
          </div>
        </div>
      )}
    </aside>
  );
}
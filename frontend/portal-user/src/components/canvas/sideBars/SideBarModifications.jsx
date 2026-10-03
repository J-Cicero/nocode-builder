import PositionPart from "./sideBarModificationsParts/PositionPart";
import LayoutPart from "./sideBarModificationsParts/LayoutPart";
import AppearancePart from "./sideBarModificationsParts/AppearancePart";
import ColorPart from "./sideBarModificationsParts/ColorPart";
import InformationPart from "./sideBarModificationsParts/InformationPart";
import DataBindingPart from "./sideBarModificationsParts/DataBindingPart";
import ActionPart from "./sideBarModificationsParts/ActionPart";
import { PanelRightClose, PanelLeftClose } from "lucide-react";
import { useState } from "react";

export default function SideBarModifications() {
  // État pour gérer l'affichage/masquage de la sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`${isCollapsed ? 'w-12' : 'w-[300px]'} border-l border-gray-200 h-screen overflow-y-auto transition-all duration-300 ease-in-out relative`}>
      {/* Bouton pour cacher/afficher la sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 right-2 p-2 hover:bg-gray-100 rounded-md transition-colors z-10"
        title={isCollapsed ? "Afficher la sidebar" : "Masquer la sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftClose className="w-5 h-5 text-gray-600" />
        ) : (
          <PanelRightClose className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Contenu de la sidebar - affiché seulement si non collapsed */}
      {!isCollapsed && (
        <div className="p-3 pt-16">
          <label className="my-2 text-3xl font-bold block">Edit</label>
          <InformationPart />
          <DataBindingPart />
          <ActionPart />
          <PositionPart />
          <LayoutPart />
          <AppearancePart />
          <ColorPart />
        </div>
      )}

      {/* Icône réduite quand la sidebar est collapsed */}
      {isCollapsed && (
        <div className="p-3 pt-16 flex flex-col items-center">
          <div className="text-xs font-bold text-gray-500 writing-mode-vertical transform rotate-0">
            Edit
          </div>
        </div>
      )}
    </aside>
  );
}
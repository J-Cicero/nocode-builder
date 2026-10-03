// src/components/SideBarComponents.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../../../store/projectStore";
import { nodeTypes } from "../../../constants/nodeTypes";
import { LayoutTemplate, Plus, Trash2, GripVertical, FileText, Folder } from "lucide-react";
import { PanelRightClose, PanelLeftClose } from "lucide-react";
import { useToast } from "../../../context/ToastContext";

// Libellés lisibles par type
const labelFromType = (type) => {
  switch (type) {
    case "textNode":
      return "Texte / Paragraphe";
    case "buttonNode":
      return "Bouton d'Action";
    case "inputNode":
      return "Champ de saisie";
    case "imageNode":
      return "Média / Image";
    case "containerNode":
      return "Bloc / Conteneur";
    case "listNode": return "Liste de Données";
    case "headingNode": return "Titre";
    case "cardNode": return "Carte de Contenu";
    case "navNode": return "Barre de Navigation";
    case "formNode": return "Formulaire";
    default:
      return type;
  }
};

// Préviews non connectées
function TextNodePreview() {
  return (
    <p className="m-0 whitespace-pre-wrap text-sm text-gray-800">Paragraphe</p>
  );
}

function ButtonNodePreview() {
  return (
    <button className="cursor-pointer rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100">
      Bouton
    </button>
  );
}

function InputNodePreview() {
  return (
    <div className="w-full h-8 border border-gray-300 rounded bg-gray-50 flex items-center px-2 text-[10px] text-gray-400">
      Saisir...
    </div>
  );
}

function ImageNodePreview() {
  return (
    <div className="w-12 h-12 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
    </div>
  );
}

function ContainerNodePreview() {
  return (
    <div className="w-full h-12 bg-white border border-dashed border-[#E8D9C4] rounded-lg flex items-center justify-center text-[10px] text-[#A08060] font-bold">
      CONTENEUR
    </div>
  );
}

const ListNodePreview = () => (
  <div className="flex flex-col items-center justify-center p-2 h-12 bg-white border border-gray-200 rounded-md shadow-sm">
    <div className="w-full flex items-center justify-between px-2 mb-1">
      <div className="w-1/2 h-1 bg-[#C4622D] rounded"></div>
      <div className="w-1/4 h-1 bg-gray-300 rounded"></div>
    </div>
    <div className="w-full flex items-center justify-between px-2 mb-1 opacity-60">
      <div className="w-1/2 h-1 bg-[#C4622D] rounded"></div>
      <div className="w-1/4 h-1 bg-gray-300 rounded"></div>
    </div>
    <div className="w-full flex items-center justify-between px-2 opacity-30">
      <div className="w-1/2 h-1 bg-[#C4622D] rounded"></div>
      <div className="w-1/4 h-1 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const HeadingPreview = () => (
  <div className="flex items-center justify-center h-12">
    <span className="text-lg font-bold font-serif text-[#1A0E0A]">Titre H1</span>
  </div>
);

const CardPreview = () => (
  <div className="flex flex-col h-12 p-1 bg-white border border-[#E8D9C4] rounded-md shadow-sm">
    <div className="w-full h-4 bg-[#FBF4E9] rounded mb-1"></div>
    <div className="w-3/4 h-1.5 bg-gray-700 rounded mb-1"></div>
    <div className="w-full h-1 bg-gray-300 rounded"></div>
    <div className="w-2/3 h-1 bg-gray-300 rounded mt-0.5"></div>
  </div>
);

const NavPreview = () => (
  <div className="flex items-center justify-between px-2 h-12 bg-white border border-[#E8D9C4] rounded-md shadow-sm">
    <div className="w-4 h-4 bg-[#C4622D] rounded-full"></div>
    <div className="flex gap-1">
      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
    </div>
  </div>
);

const FormPreview = () => (
  <div className="flex flex-col h-14 p-1.5 bg-white border border-[#E8D9C4] rounded-md shadow-sm gap-1">
    <div className="w-1/2 h-1.5 bg-gray-700 rounded mb-0.5"></div>
    <div className="w-full h-2.5 bg-gray-100 border border-gray-200 rounded"></div>
    <div className="w-full h-2.5 bg-gray-100 border border-gray-200 rounded"></div>
    <div className="w-full h-2.5 bg-[#1A0E0A] rounded mt-0.5"></div>
  </div>
);

// Map previews
const previews = {
  textNode: TextNodePreview,
  buttonNode: ButtonNodePreview,
  inputNode: InputNodePreview,
  imageNode: ImageNodePreview,
  containerNode: ContainerNodePreview,
  listNode: ListNodePreview,
  headingNode: HeadingPreview,
  cardNode: CardPreview,
  navNode: NavPreview,
  formNode: FormPreview,
};

export default function SideBarComponents({ pages, createPage, deletePage }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects } = useProjects();
  const [activeTab, setActiveTab] = useState("components");
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const toast = useToast();

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;
    try {
      await createPage({
        nom: newPageName,
        chemin: `/${newPageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type_page: "desktop"
      });
      setNewPageName("");
      setIsCreatingPage(false);
      toast.success(`Page "${newPageName}" créée avec succès`);
    } catch (err) {
      console.error("Erreur création page:", err);
      toast.alert("Impossible de créer la page");
    }
  };
  // État pour gérer l'affichage/masquage de la sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const items = useMemo(
    () =>
      Object.keys(nodeTypes).map((type) => ({
        type,
        label: labelFromType(type),
        Preview:
          previews[type] ??
          (() => (
            <div className="rounded-md border border-dashed border-gray-300 p-2 text-xs text-gray-500">
              {type}
            </div>
          )),
      })),
    []
  );

  const onDragStart = (event, type) => {
    console.log("🚀 DRAG START:", type);
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.setData("text/plain", type); // Compatibilité Firefox
    event.dataTransfer.effectAllowed = "move";
    
    // Image de drag personnalisée (optionnel)
    const ghost = event.currentTarget.cloneNode(true);
    ghost.style.opacity = '0.5';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <aside className={`${isCollapsed ? 'w-12' : 'w-[280px]'} border-r border-gray-200 h-screen bg-gray-50 flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Bouton pour cacher/afficher la sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute top-3 right-3 p-1.5 hover:bg-gray-200 rounded-md transition-colors z-10"
        title={isCollapsed ? "Afficher" : "Masquer"}
      >
        {isCollapsed ? (
          <PanelRightClose className="w-4 h-4 text-gray-600" />
        ) : (
          <PanelLeftClose className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {isCollapsed ? (
        <div className="pt-16 flex flex-col items-center">
          <div className="text-xs font-bold text-gray-500 transform -rotate-90 mt-8">
            PANNEAU
          </div>
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-200 mt-12">
            <button
              onClick={() => setActiveTab("components")}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "components" ? "border-[#C4622D] text-[#C4622D] bg-white" : "border-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              Composants
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "pages" ? "border-[#C4622D] text-[#C4622D] bg-white" : "border-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "projects" ? "border-[#C4622D] text-[#C4622D] bg-white" : "border-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              Projets
            </button>
          </div>

          {activeTab === "components" && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {items.map(({ type, label, Preview }) => (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    className="flex flex-col gap-2 group cursor-grab active:cursor-grabbing bg-white p-3 rounded-xl border border-gray-200 hover:border-[#C4622D] shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="w-full flex justify-center items-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <Preview />
                    </div>
                    <span className="text-[9px] font-bold text-center text-gray-600 group-hover:text-[#C4622D] uppercase mt-1 leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Pages du Projet
                </h2>
                <button 
                  onClick={() => setIsCreatingPage(true)}
                  className="p-1 text-[#C4622D] hover:bg-[#FBF4E9] rounded-md transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {isCreatingPage && (
                <div className="mb-4 bg-white p-3 rounded-xl border border-[#C4622D] shadow-sm">
                  <input
                    autoFocus
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="Nom de la page"
                    className="w-full text-sm outline-none border-b border-gray-200 pb-1 mb-2"
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePage()}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreatePage}
                      className="flex-1 bg-[#C4622D] text-white text-[10px] font-bold py-1.5 rounded uppercase tracking-wider"
                    >
                      Ajouter
                    </button>
                    <button 
                      onClick={() => setIsCreatingPage(false)}
                      className="flex-1 bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 rounded hover:bg-gray-200 uppercase tracking-wider"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 flex-1 overflow-y-auto">
                {pages?.map((p) => (
                  <div 
                    key={p.tracking_id}
                    onClick={() => {
                      const el = document.getElementById(`workspace-page-${p.tracking_id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                        // Optionnel : ajouter un effet de surbrillance
                        el.style.boxShadow = "0 0 0 4px #C4622D";
                        setTimeout(() => {
                          el.style.boxShadow = "";
                        }, 2000);
                      }
                    }}
                    className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 hover:border-[#C4622D] shadow-sm group transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400 group-hover:text-[#C4622D]" />
                      <span className="text-xs font-bold text-[#1A0E0A] truncate max-w-[120px]">{p.nom}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.confirm(`Supprimer la page ${p.nom} ?`) && deletePage(p.tracking_id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {(!pages || pages.length === 0) && !isCreatingPage && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Aucune page. Cliquez sur + pour en créer une.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Mes Projets ({projects.length})
                </h2>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {projects.map((proj) => {
                  const isCurrent = proj.tracking_id === projectId;
                  return (
                    <div
                      key={proj.tracking_id}
                      onClick={() => {
                        if (!isCurrent) {
                          navigate(`/app/editor/${proj.tracking_id}`);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#FFF0E8] border-[#C4622D] shadow-sm"
                          : "bg-white border-gray-200 hover:border-[#C4622D] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder size={16} className={isCurrent ? "text-[#C4622D]" : "text-gray-400"} />
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold truncate max-w-[150px] ${isCurrent ? "text-[#C4622D]" : "text-[#1A0E0A]"}`}>
                            {proj.name}
                          </span>
                          {proj.description && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {proj.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Aucun projet enregistré.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

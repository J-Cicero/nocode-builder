import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useInterface from "../hooks/useInterface";
import SectionRenderer from "../components/sectionsRenderer/SectionRenderer";
import PreviewRenderer from "../components/editor/PreviewRenderer";
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Loader2, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function PreviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { pages, loading, error } = useInterface(projectId);

  const [activePageId, setActivePageId] = useState(null);
  const [viewportMode, setViewportMode] = useState("desktop");

  useEffect(() => {
    if (pages && pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].tracking_id || pages[0].id);
    }
  }, [pages, activePageId]);

  const activePage = pages.find(
    (p) => (p.tracking_id || p.id) === activePageId
  ) || pages[0];

  const getViewportClass = () => {
    switch (viewportMode) {
      case "mobile":
        return "w-[375px] min-h-[667px] shadow-2xl rounded-3xl border-8 border-gray-800 my-8 overflow-hidden bg-white";
      case "tablet":
        return "w-[768px] min-h-[1024px] shadow-2xl rounded-2xl border-4 border-gray-700 my-8 overflow-hidden bg-white";
      default:
        return "w-full min-h-screen bg-white shadow-sm border border-gray-200 rounded-xl my-4";
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans">
      {/* HEADER DE PRÉVISUALISATION */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/app/editor/${projectId}`)}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center gap-2 text-sm font-semibold"
            title="Retour à l'éditeur"
          >
            <ArrowLeft size={18} />
            <span>Éditeur</span>
          </button>

          <div className="h-6 w-px bg-gray-200"></div>

          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#C4622D]" />
            <h1 className="text-sm font-bold text-gray-900">
              {activePage?.nom || `Aperçu Projet`}
            </h1>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} />
              Aperçu Réel (Système B)
            </span>
          </div>
        </div>

        {/* SÉLECTEUR DE PAGE & VIEWPORT */}
        <div className="flex items-center gap-6">
          {pages.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-gray-500">Page :</span>
              <select
                value={activePageId || ""}
                onChange={(e) => setActivePageId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
              >
                {pages.map((p) => (
                  <option key={p.tracking_id || p.id} value={p.tracking_id || p.id}>
                    {p.nom} ({p.chemin || `/${p.slug || ""}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Responsive */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewportMode("desktop")}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === "desktop" ? "bg-white shadow text-[#C4622D]" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setViewportMode("tablet")}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === "tablet" ? "bg-white shadow text-[#C4622D]" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Tablette"
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setViewportMode("mobile")}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === "mobile" ? "bg-white shadow text-[#C4622D]" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL DE PRÉVISUALISATION */}
      <main className="flex-1 flex justify-center items-start px-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-3">
            <Loader2 size={32} className="animate-spin text-[#C4622D]" />
            <span className="text-sm font-semibold">Chargement des données de l'interface...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl my-12 text-sm font-semibold">
            <AlertCircle size={20} />
            <span>Erreur : {error}</span>
          </div>
        ) : !activePage ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-2">
            <p className="text-base font-semibold">Aucune page trouvée pour ce projet.</p>
            <p className="text-sm">Créez votre première page ou demandez à l'assistant IA de la générer.</p>
          </div>
        ) : (
          <div className={`transition-all duration-300 ${getViewportClass()}`}>
            {activePage.sections && activePage.sections.length > 0 ? (
              <SectionRenderer sections={activePage.sections} />
            ) : (
              <PreviewRenderer page={activePage} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

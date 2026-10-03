import React, { useState } from "react";
import { useProjects } from "../../store/projectStore";
import { useToast } from "../../context/ToastContext";
import { Play, Rocket, Layout, Database, Zap, ArrowLeft, Loader2, Monitor, Tablet, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import generatorApi from "../../api/generatorApi";

export default function EditorHeader() {
  const { currentProject, activeView, setActiveView, viewportMode, setViewportMode } = useProjects();
  const navigate = useNavigate();
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = () => {
    if (!currentProject) return;
    window.open(`/app/preview/${currentProject.tracking_id}`, "_blank");
  };

  const handlePublish = async () => {
    if (!currentProject) return;
    if (!window.confirm("Voulez-vous vraiment publier votre application ?")) return;
    
    setIsGenerating(true);
    try {
      await generatorApi.deploy(currentProject.tracking_id);
      toast.success("Félicitations ! Votre application est en cours de déploiement sur Vercel.");
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors du déploiement.");
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: "interface", label: "Interface", icon: Layout },
    { id: "data", label: "Données", icon: Database },
    { id: "logic", label: "Logique", icon: Zap },
  ];

  return (
    <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-50">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate('/app/dashboard')}
          className="p-2 hover:bg-[#FBF4E9] rounded-xl text-[#A08060] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-[#1A0E0A] font-serif leading-none">
            {currentProject?.name || "Projet EnoC"}
          </h1>
          <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Enregistré
          </span>
        </div>

        <div className="h-10 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center bg-[#FBF4E9] p-1 rounded-2xl border border-[#E8D9C4]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === tab.id 
                  ? "bg-[#C4622D] text-white shadow-md" 
                  : "text-[#7A5C44] hover:text-[#C4622D]"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === "interface" && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-gray-200">
          <button 
            onClick={() => setViewportMode("desktop")}
            className={`p-2 rounded-xl transition-all ${viewportMode === "desktop" ? "bg-white shadow text-[#1A0E0A]" : "text-gray-400 hover:text-[#1A0E0A]"}`}
            title="Desktop"
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setViewportMode("tablet")}
            className={`p-2 rounded-xl transition-all ${viewportMode === "tablet" ? "bg-white shadow text-[#1A0E0A]" : "text-gray-400 hover:text-[#1A0E0A]"}`}
            title="Tablet"
          >
            <Tablet size={16} />
          </button>
          <button 
            onClick={() => setViewportMode("mobile")}
            className={`p-2 rounded-xl transition-all ${viewportMode === "mobile" ? "bg-white shadow text-[#1A0E0A]" : "text-gray-400 hover:text-[#1A0E0A]"}`}
            title="Mobile"
          >
            <Smartphone size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button 
          onClick={handlePreview}
          disabled={isGenerating}
          className="px-4 py-2 bg-white border border-[#E8D9C4] rounded-xl text-[#7A5C44] text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          Aperçu
        </button>
        <button 
          onClick={handlePublish}
          disabled={isGenerating}
          className="px-6 py-2 bg-[#C4622D] text-white rounded-xl text-sm font-bold hover:bg-[#A04E24] flex items-center gap-2 shadow-lg shadow-[#C4622D]/20 transition-all disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
          Publier
        </button>
      </div>
    </div>
  );
}

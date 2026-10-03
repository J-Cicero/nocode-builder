import React, { useState } from "react";
import { useProjects } from "../../store/projectStore";
import { useToast } from "../../context/ToastContext";
import { 
  Play, 
  Rocket, 
  Layout, 
  Database, 
  Zap, 
  ArrowLeft, 
  Loader2, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Cloud 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import generatorApi from "../../api/generatorApi";

export default function EditorHeader() {
  const { currentProject, activeView, setActiveView, viewportMode, setViewportMode } = useProjects();
  const navigate = useNavigate();
  const toast = useToast();

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);

  const handlePreview = () => {
    if (!currentProject) return;
    window.open(`/app/preview/${currentProject.tracking_id || currentProject.uuid || currentProject.id}`, "_blank");
  };

  const handleDeployToCloud = async () => {
    if (!currentProject) return;
    const projectId = currentProject.tracking_id || currentProject.uuid || currentProject.id;

    setIsDeploying(true);
    setDeploymentResult(null);
    try {
      const res = await generatorApi.deploy(projectId);
      const url = res.data?.url;
      setDeploymentResult({
        success: true,
        url: url,
        message: url 
          ? "Application déployée avec succès sur Vercel !" 
          : "Déploiement initié avec succès.",
      });
      toast.success("Déploiement réussi !");
    } catch (err) {
      console.error(err);
      // Si Vercel token n'est pas encore configuré, on propose la preview statique
      try {
        const previewRes = await generatorApi.deployPreview(projectId);
        setDeploymentResult({
          success: true,
          previewUrl: previewRes.data?.preview_url,
          message: "Déploiement d'aperçu statique généré avec succès !",
        });
        toast.success("Aperçu statique déployé !");
      } catch (prevErr) {
        toast.alert(err.userMessage || "Erreur lors du déploiement cloud.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadCode = async () => {
    if (!currentProject) return;
    const projectId = currentProject.tracking_id || currentProject.uuid || currentProject.id;

    setIsDownloading(true);
    try {
      const genRes = await generatorApi.generate(projectId, {
        nom: currentProject.name || "application",
      });
      const trackingId = genRes.data?.tracking_id;
      if (trackingId) {
        const downloadRes = await generatorApi.download(trackingId);
        const blob = new Blob([downloadRes.data], { type: "application/zip" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${currentProject.name || "app"}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Code source ZIP (FastAPI + React) téléchargé !");
      }
    } catch (err) {
      console.error(err);
      toast.alert("Erreur lors de la génération du code ZIP.");
    } finally {
      setIsDownloading(false);
    }
  };

  const tabs = [
    { id: "interface", label: "Interface", icon: Layout },
    { id: "data", label: "Données", icon: Database },
    { id: "logic", label: "Logique", icon: Zap },
  ];

  return (
    <>
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
            className="px-4 py-2 bg-white border border-[#E8D9C4] rounded-xl text-[#7A5C44] text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            Aperçu
          </button>
          <button 
            onClick={() => setIsDeployModalOpen(true)}
            className="px-6 py-2 bg-[#C4622D] text-white rounded-xl text-sm font-bold hover:bg-[#A04E24] flex items-center gap-2 shadow-lg shadow-[#C4622D]/20 transition-all cursor-pointer"
          >
            <Rocket size={16} />
            Déployer
          </button>
        </div>
      </div>

      {/* MODALE DE DÉPLOIEMENT */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C4622D]/10 flex items-center justify-center text-[#C4622D]">
                  <Rocket size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Déploiement de l'application</h3>
                  <p className="text-xs text-gray-500">{currentProject?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Résultat du déploiement s'il existe */}
            {deploymentResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  <span>{deploymentResult.message}</span>
                </div>
                {(deploymentResult.url || deploymentResult.previewUrl) && (
                  <a
                    href={deploymentResult.url || deploymentResult.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4622D] hover:underline pt-1"
                  >
                    <span>Ouvrir l'application en ligne</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Options de déploiement */}
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-xl hover:border-[#C4622D] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud size={20} className="text-[#C4622D]" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Déployer sur le Cloud (Vercel)</h4>
                    <p className="text-xs text-gray-500">Mise en ligne instantanée avec URL publique.</p>
                  </div>
                </div>
                <button
                  onClick={handleDeployToCloud}
                  disabled={isDeploying}
                  className="px-4 py-2 bg-[#C4622D] text-white rounded-lg text-xs font-bold hover:bg-[#A04E24] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                  <span>Lancer</span>
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-gray-600" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Télécharger le code source</h4>
                    <p className="text-xs text-gray-500">Archive ZIP complète (FastAPI + React + Dockerfile).</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadCode}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>ZIP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

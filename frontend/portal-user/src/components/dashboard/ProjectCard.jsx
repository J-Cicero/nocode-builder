import { useNavigate } from "react-router-dom";
import { Trash2, Calendar, Layout, Database } from "lucide-react";
import Button from "../common/Button";

const statusMeta = {
  published: { bar: "bg-green-600", badge: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-600" },
  draft: { bar: "bg-[#C4622D]", badge: "bg-[#FFF0E8] text-[#C4622D] border-[#FFE0D1]", dot: "bg-[#C4622D]" },
  archived: { bar: "bg-gray-500", badge: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-500" },
};

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const meta = statusMeta[project.status] || statusMeta.draft;
  const initials = project.name.slice(0, 2).toUpperCase();

  const handleOpenEditor = (e) => {
    e.stopPropagation();
    navigate(`/app/editor/${project.tracking_id}`);
  };

  const handleOpenData = (e) => {
    e.stopPropagation();
    navigate(`/app/data/${project.tracking_id}`);
  };

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-[#E8D9C4] hover:border-[#C4622D] shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Top Status Bar */}
      <div className={`h-1.5 w-full ${meta.bar}`} />
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-[#FBF4E9] rounded-xl flex items-center justify-center text-[#C4622D] font-serif font-bold text-xl shadow-inner group-hover:bg-[#C4622D] group-hover:text-white transition-colors">
            {initials}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} />
            {project.status}
          </div>
        </div>

        <h3 className="text-xl font-bold text-[#1A0E0A] font-serif mb-2 group-hover:text-[#C4622D] transition-colors">
          {project.name}
        </h3>
        
        <p className="text-[#7A5C44] text-sm line-clamp-2 mb-6 leading-relaxed min-h-[40px]">
          {project.description || "Aucune description fournie pour ce projet."}
        </p>

        <div className="flex items-center gap-4 text-[#A08060] text-xs mb-6">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layout size={14} />
            <span>{(project.pages_count || 0)} Pages</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1 gap-2 text-xs py-2.5"
            onClick={handleOpenEditor}
          >
            <Layout size={14} />
            Éditeur
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2 text-xs py-2.5"
            onClick={handleOpenData}
          >
            <Database size={14} />
            Données
          </Button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(project.tracking_id); }}
            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect } from "react";
import projectsApi from "../api/projectsApi";
import { useAuth } from "./authStore";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState("interface");
  const [activeView, setActiveView] = useState("interface"); // interface, data, logic
  const [viewportMode, setViewportMode] = useState("desktop"); // desktop, tablet, mobile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await projectsApi.getAll();
        const arr = Array.isArray(data) ? data : (data.projects || []);
        setProjects(arr.map(p => ({ ...p, tracking_id: p.tracking_id || p.uuid })));
      } catch (err) {
        setError(err?.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [token]);

  const createProject = async (data) => {
    setError(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        is_public: data.is_public || false,
      };
      console.log("🚀 Création du projet avec le payload:", payload);
      const { data: created } = await projectsApi.create(payload);
      console.log("✅ Projet créé avec succès:", created);
      const mappedCreated = { ...created, tracking_id: created.uuid || created.tracking_id };
      
      setProjects((prev) => {
        const currentProjects = Array.isArray(prev) ? prev : [];
        return [...currentProjects, mappedCreated];
      });
      return mappedCreated;
    } catch (err) {
      const rawDetail = err?.response?.data?.detail;
      const msg = typeof rawDetail === "string" 
        ? rawDetail 
        : (Array.isArray(rawDetail) ? rawDetail.map(e => e.msg).join(", ") : (err?.message || "Erreur de création"));
      console.error("❌ Erreur lors de la création du projet:", msg);
      setError(msg);
      throw err;
    }
  };

  const deleteProject = async (tracking_id) => {
    await projectsApi.delete(tracking_id);
    setProjects((prev) => prev.filter((p) => p.tracking_id !== tracking_id));
    if (currentProject?.tracking_id === tracking_id) {
      setCurrentProject(null);
    }
  };

  const updateProject = async (tracking_id, updates) => {
    const { data } = await projectsApi.update(tracking_id, updates);
    setProjects((prev) =>
      prev.map((p) => (p.tracking_id === tracking_id ? data : p))
    );
    if (currentProject?.tracking_id === tracking_id) {
      setCurrentProject(data);
    }
    return data;
  };

  const value = {
    projects,
    currentProject,
    activeTab,
    loading,
    error,
    createProject,
    deleteProject,
    updateProject,
    setCurrentProject,
    setActiveTab,
    activeView,
    setActiveView,
    viewportMode,
    setViewportMode
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectProvider");
  }
  return context;
}

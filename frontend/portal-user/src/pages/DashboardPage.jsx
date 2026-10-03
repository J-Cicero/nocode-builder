import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import ProjectCard from "../components/dashboard/ProjectCard";
import NewProjectModal from "../components/dashboard/NewProjectModal";
import Button from "../components/common/Button";
import { useProjects } from "../store/projectStore";
import { useAuth } from "../store/authStore";

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, createProject, deleteProject, loading, error } = useProjects();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 17) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === "all" ? true : p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    total: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    published: projects.filter((p) => p.status === "published").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  const handleCreate = async (data) => {
    try {
      await createProject({
        name: data.name,
        description: data.description || "Gérez votre application en toute simplicité.",
        is_public: data.is_public,
      });
      setIsModalOpen(false);
    } catch (err) {
      // L'erreur est déjà gérée dans le store (setError),
      // mais on peut ajouter un feedback ici si nécessaire
      console.error("Échec de création dans DashboardPage:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4E9]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[#2C1A0E] font-serif">
              {greeting}, {user?.name || "builder"} 👋
            </h1>
            <p className="text-[#7A5C44] text-lg">
              Que construisez-vous aujourd'hui ?
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Nouveau Projet
            </Button>
          </div>
        </section>

        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["all", "draft", "published", "archived"].map((key) => {
              const labels = { all: "Tous", draft: "Brouillons", published: "Publiés", archived: "Archivés" };
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active 
                      ? "bg-[#C4622D] text-white border-transparent" 
                      : "bg-white text-[#7A5C44] border-[#E8D9C4] border hover:border-[#C4622D]"
                  }`}
                >
                  {labels[key]} ({key === "all" ? counts.total : counts[key]})
                </button>
              );
            })}
          </div>

          <div className="relative">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A5C44"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M16 16l4 4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un projet..."
              className="pl-10 pr-4 py-2 bg-white border border-[#E8D9C4] rounded-full text-sm focus:outline-none focus:border-[#C4622D] w-full md:w-64"
            />
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-20 text-[#7A5C44]">Chargement des projets...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">{error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-[#E8D9C4]">
             <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF0E8]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4622D" strokeWidth="2">
                   <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
             </div>
             <h3 className="text-xl font-medium text-[#2C1A0E] mb-1">Aucun projet trouvé</h3>
             <p className="text-[#7A5C44]">Commencez par créer votre première application.</p>
             <Button variant="primary" onClick={() => setIsModalOpen(true)} className="mt-6">
               Créer mon premier projet
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.tracking_id}
                project={project}
                onDelete={(id) => deleteProject(id)}
              />
            ))}
          </div>
        )}
      </main>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

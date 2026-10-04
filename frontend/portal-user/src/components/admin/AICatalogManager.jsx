import React, { useState, useEffect } from "react";
import { 
  Bot, Server, Plus, CheckCircle2, XCircle, AlertCircle, 
  Trash2, Edit3, Key, Play, Shield, Check, Lock, RefreshCw, X
} from "lucide-react";
import aiApi from "../../api/aiApi";
import { formatApiError } from "../../api/axios";

export default function AICatalogManager() {
  const [activeTab, setActiveTab] = useState("models"); // "models" | "providers"
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState({}); // { [id]: { loading: bool, ok: bool, msg: string } }

  // Modals state
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerForm, setProviderForm] = useState({
    name: "",
    display_name: "",
    base_url: "https://api.openai.com/v1",
    api_key: "",
    is_active: true,
  });

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelForm, setModelForm] = useState({
    provider_id: "",
    model_id: "",
    display_name: "",
    description: "",
    allowed_plans: [], // empty = all
    is_active: true,
    is_default: false,
    sort_order: 0,
  });

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [provRes, modRes] = await Promise.all([
        aiApi.getAdminProviders(),
        aiApi.getAdminModels(),
      ]);
      setProviders(provRes.data || []);
      setModels(modRes.data || []);
    } catch (err) {
      setFeedback({ type: "error", message: formatApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ─── Fournisseurs ────────────────────────────────────────────────────────
  const openNewProvider = () => {
    setEditingProvider(null);
    setProviderForm({
      name: "",
      display_name: "",
      base_url: "https://api.openai.com/v1",
      api_key: "",
      is_active: true,
    });
    setIsProviderModalOpen(true);
  };

  const openEditProvider = (p) => {
    setEditingProvider(p);
    setProviderForm({
      name: p.name,
      display_name: p.display_name,
      base_url: p.base_url,
      api_key: "", // empty means keep existing
      is_active: p.is_active,
    });
    setIsProviderModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        const payload = {
          display_name: providerForm.display_name,
          base_url: providerForm.base_url,
          is_active: providerForm.is_active,
        };
        if (providerForm.api_key.trim()) {
          payload.api_key = providerForm.api_key.trim();
        }
        await aiApi.updateAdminProvider(editingProvider.id || editingProvider.tracking_id, payload);
        setFeedback({ type: "success", message: `Fournisseur « ${providerForm.display_name} » mis à jour avec succès.` });
      } else {
        await aiApi.createAdminProvider({
          name: providerForm.name.trim().toLowerCase(),
          display_name: providerForm.display_name.trim(),
          base_url: providerForm.base_url.trim(),
          api_key: providerForm.api_key.trim(),
          is_active: providerForm.is_active,
        });
        setFeedback({ type: "success", message: `Fournisseur « ${providerForm.display_name} » créé avec succès.` });
      }
      setIsProviderModalOpen(false);
      loadData();
    } catch (err) {
      setFeedback({ type: "error", message: formatApiError(err) });
    }
  };

  const handleDeleteProvider = async (p) => {
    if (!window.confirm(`Supprimer le fournisseur « ${p.display_name} » ainsi que tous ses modèles associés ?`)) {
      return;
    }
    try {
      await aiApi.deleteAdminProvider(p.id || p.tracking_id);
      setFeedback({ type: "success", message: `Fournisseur « ${p.display_name} » supprimé.` });
      loadData();
    } catch (err) {
      setFeedback({ type: "error", message: formatApiError(err) });
    }
  };

  const handleTestProvider = async (p) => {
    const pId = p.id || p.tracking_id;
    setTestStatus(prev => ({ ...prev, [pId]: { loading: true } }));
    try {
      const { data } = await aiApi.testAdminProvider(pId);
      setTestStatus(prev => ({ ...prev, [pId]: { loading: false, ok: data.ok, msg: data.message } }));
    } catch (err) {
      setTestStatus(prev => ({ ...prev, [pId]: { loading: false, ok: false, msg: formatApiError(err) } }));
    }
  };

  // ─── Modèles ─────────────────────────────────────────────────────────────
  const openNewModel = () => {
    setEditingModel(null);
    const defaultProvId = providers.length > 0 ? (providers[0].id || providers[0].tracking_id) : "";
    setModelForm({
      provider_id: defaultProvId,
      model_id: "",
      display_name: "",
      description: "",
      allowed_plans: [],
      is_active: true,
      is_default: false,
      sort_order: (models.length + 1) * 10,
    });
    setIsModelModalOpen(true);
  };

  const openEditModel = (m) => {
    setEditingModel(m);
    setModelForm({
      provider_id: m.provider_id,
      model_id: m.model_id,
      display_name: m.display_name,
      description: m.description || "",
      allowed_plans: m.allowed_plans || [],
      is_active: m.is_active,
      is_default: m.is_default,
      sort_order: m.sort_order || 0,
    });
    setIsModelModalOpen(true);
  };

  const handleSaveModel = async (e) => {
    e.preventDefault();
    try {
      if (editingModel) {
        const payload = {
          model_id: modelForm.model_id.trim(),
          display_name: modelForm.display_name.trim(),
          description: modelForm.description.trim() || null,
          allowed_plans: modelForm.allowed_plans,
          is_active: modelForm.is_active,
          is_default: modelForm.is_default,
          sort_order: parseInt(modelForm.sort_order, 10) || 0,
        };
        await aiApi.updateAdminModel(editingModel.id || editingModel.tracking_id, payload);
        setFeedback({ type: "success", message: `Modèle « ${modelForm.display_name} » mis à jour.` });
      } else {
        await aiApi.createAdminModel({
          provider_id: modelForm.provider_id,
          model_id: modelForm.model_id.trim(),
          display_name: modelForm.display_name.trim(),
          description: modelForm.description.trim() || null,
          allowed_plans: modelForm.allowed_plans,
          is_active: modelForm.is_active,
          is_default: modelForm.is_default,
          sort_order: parseInt(modelForm.sort_order, 10) || 0,
        });
        setFeedback({ type: "success", message: `Modèle « ${modelForm.display_name} » ajouté au catalogue.` });
      }
      setIsModelModalOpen(false);
      loadData();
    } catch (err) {
      setFeedback({ type: "error", message: formatApiError(err) });
    }
  };

  const handleDeleteModel = async (m) => {
    if (!window.confirm(`Supprimer le modèle « ${m.display_name} » ?`)) return;
    try {
      await aiApi.deleteAdminModel(m.id || m.tracking_id);
      setFeedback({ type: "success", message: `Modèle « ${m.display_name} » supprimé.` });
      loadData();
    } catch (err) {
      setFeedback({ type: "error", message: formatApiError(err) });
    }
  };

  const handleTestModel = async (m) => {
    const mId = m.id || m.tracking_id;
    setTestStatus(prev => ({ ...prev, [mId]: { loading: true } }));
    try {
      const { data } = await aiApi.testAdminModel(mId);
      setTestStatus(prev => ({ ...prev, [mId]: { loading: false, ok: data.ok, msg: data.message } }));
    } catch (err) {
      setTestStatus(prev => ({ ...prev, [mId]: { loading: false, ok: false, msg: formatApiError(err) } }));
    }
  };

  const togglePlanInForm = (plan) => {
    setModelForm(prev => {
      const exists = prev.allowed_plans.includes(plan);
      return {
        ...prev,
        allowed_plans: exists 
          ? prev.allowed_plans.filter(p => p !== plan)
          : [...prev.allowed_plans, plan]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête & Onglets */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8D9C4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Administration Dynamique
              </span>
              <span className="text-xs text-gray-500 font-mono">Zero Hardcoded Keys</span>
            </div>
            <h2 className="text-xl font-bold text-[#1A0E0A] mt-1">Catalogue & Fournisseurs d'IA</h2>
            <p className="text-xs text-[#7A5C44]">
              Configurez dynamiquement les modèles d'IA, les clés chiffrées et l'attribution par niveau d'abonnement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            {activeTab === "providers" ? (
              <button
                onClick={openNewProvider}
                className="px-4 py-2 bg-[#C4622D] hover:bg-[#A85122] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Nouveau Fournisseur</span>
              </button>
            ) : (
              <button
                onClick={openNewModel}
                disabled={providers.length === 0}
                className="px-4 py-2 bg-[#C4622D] hover:bg-[#A85122] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Nouveau Modèle</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            feedback.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-gray-100 pb-2">
          <button
            onClick={() => setActiveTab("models")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "models"
                ? "bg-[#1A0E0A] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Bot size={15} />
            <span>Modèles d'IA ({models.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "providers"
                ? "bg-[#1A0E0A] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Server size={15} />
            <span>Fournisseurs ({providers.length})</span>
          </button>
        </div>
      </div>

      {/* ── Onglet Modèles ── */}
      {activeTab === "models" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8D9C4] space-y-4">
          {models.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-3">
              <Bot size={36} className="mx-auto text-gray-400" />
              <p className="text-sm font-semibold">Aucun modèle d'IA configuré pour le moment.</p>
              <button
                onClick={openNewModel}
                disabled={providers.length === 0}
                className="px-4 py-2 bg-[#C4622D] text-white rounded-xl text-xs font-bold"
              >
                Ajouter un modèle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Modèle</th>
                    <th className="py-3 px-3">Fournisseur</th>
                    <th className="py-3 px-3">Identifiant API</th>
                    <th className="py-3 px-3">Forfaits Autorisés</th>
                    <th className="py-3 px-3">Statut</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {models.map((m) => {
                    const mId = m.id || m.tracking_id;
                    const test = testStatus[mId];
                    return (
                      <tr key={mId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#1A0E0A] text-sm flex items-center gap-1.5">
                            {m.display_name}
                            {m.is_default && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                                Défaut
                              </span>
                            )}
                          </div>
                          {m.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-gray-700">
                          {m.provider_name}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-gray-600 bg-gray-50 rounded px-2 py-1 w-fit">
                          {m.model_id}
                        </td>
                        <td className="py-3.5 px-3">
                          {m.allowed_plans && m.allowed_plans.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {m.allowed_plans.map((p) => (
                                <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                                  {p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Tous (Gratuit +)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          {m.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTestModel(m)}
                              disabled={test?.loading}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                              title="Tester la réponse du modèle"
                            >
                              <Play size={13} className={test?.loading ? "animate-spin text-amber-500" : ""} />
                            </button>
                            <button
                              onClick={() => openEditModel(m)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300 transition-colors"
                              title="Modifier"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-300 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {test && !test.loading && (
                            <div className={`mt-1 text-[10px] ${test.ok ? "text-emerald-600 font-bold" : "text-red-600 font-medium"}`}>
                              {test.ok ? "✓ Réponse reçue" : `✗ ${test.msg}`}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Fournisseurs ── */}
      {activeTab === "providers" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8D9C4] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const pId = p.id || p.tracking_id;
              const test = testStatus[pId];
              return (
                <div key={pId} className="border border-gray-200 rounded-xl p-4 space-y-3 hover:border-[#C4622D]/40 transition-colors bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1A0E0A]">{p.display_name}</h3>
                        <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono mt-1 break-all">{p.base_url}</p>
                    </div>
                    {p.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500 font-bold">
                        Inactif
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Key size={13} className="text-[#C4622D]" />
                      <span className="font-mono text-[11px]">{p.api_key_hint || "••••••••"}</span>
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">(Chiffrée Fernet)</span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {p.models_count || 0} modèle(s) lié(s)
                    </span>
                  </div>

                  {test && (
                    <div className={`p-2 rounded-lg text-[11px] flex items-center gap-2 ${
                      test.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                    }`}>
                      {test.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span className="line-clamp-2">{test.msg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleTestProvider(p)}
                      disabled={test?.loading}
                      className="px-3 py-1.5 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play size={12} className={test?.loading ? "animate-spin text-amber-500" : ""} />
                      <span>{test?.loading ? "Test en cours..." : "Tester connexion"}</span>
                    </button>
                    <button
                      onClick={() => openEditProvider(p)}
                      className="p-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p)}
                      className="p-1.5 border border-gray-200 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modal Fournisseur ── */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8D9C4] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#1A0E0A]">
                {editingProvider ? "Modifier le Fournisseur" : "Ajouter un Fournisseur d'IA"}
              </h3>
              <button onClick={() => setIsProviderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Identifiant technique (slug)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingProvider}
                  value={providerForm.name}
                  onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="ex: mistral, openai, groq, deepseek, ollama"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C4622D] disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Nom Affiché
                </label>
                <input
                  type="text"
                  required
                  value={providerForm.display_name}
                  onChange={e => setProviderForm({ ...providerForm, display_name: e.target.value })}
                  placeholder="ex: Mistral AI, OpenAI, Groq Cloud"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Base URL (Compatible OpenAI)
                </label>
                <input
                  type="url"
                  required
                  value={providerForm.base_url}
                  onChange={e => setProviderForm({ ...providerForm, base_url: e.target.value })}
                  placeholder="ex: https://api.mistral.ai/v1 ou http://localhost:11434/v1"
                  className="w-full p-2.5 font-mono border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>Clé API Secrète</span>
                  {editingProvider && <span className="text-gray-400 font-normal">Laisser vide pour ne pas changer</span>}
                </label>
                <input
                  type="password"
                  required={!editingProvider}
                  value={providerForm.api_key}
                  onChange={e => setProviderForm({ ...providerForm, api_key: e.target.value })}
                  placeholder={editingProvider ? "•••••••• (Clé existante conservée)" : "sk-..."}
                  className="w-full p-2.5 font-mono border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                />
                <p className="text-[10px] text-gray-500">
                  🔒 La clé est immédiatement chiffrée avec Fernet avant écriture en base de données.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prov_active"
                  checked={providerForm.is_active}
                  onChange={e => setProviderForm({ ...providerForm, is_active: e.target.checked })}
                  className="rounded text-[#C4622D] focus:ring-[#C4622D]"
                />
                <label htmlFor="prov_active" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Fournisseur actif et disponible
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C4622D] hover:bg-[#A85122] text-white rounded-xl font-bold shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Modèle ── */}
      {isModelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8D9C4] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#1A0E0A]">
                {editingModel ? "Modifier le Modèle d'IA" : "Ajouter un Modèle d'IA"}
              </h3>
              <button onClick={() => setIsModelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Fournisseur Lié
                  </label>
                  <select
                    disabled={!!editingModel}
                    value={modelForm.provider_id}
                    onChange={e => setModelForm({ ...modelForm, provider_id: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                  >
                    {providers.map(p => (
                      <option key={p.id || p.tracking_id} value={p.id || p.tracking_id}>
                        {p.display_name} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    ID Technique du Modèle
                  </label>
                  <input
                    type="text"
                    required
                    value={modelForm.model_id}
                    onChange={e => setModelForm({ ...modelForm, model_id: e.target.value })}
                    placeholder="ex: mistral-small-latest, gpt-4o"
                    className="w-full p-2.5 font-mono border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Nom d'affichage (pour les utilisateurs)
                </label>
                <input
                  type="text"
                  required
                  value={modelForm.display_name}
                  onChange={e => setModelForm({ ...modelForm, display_name: e.target.value })}
                  placeholder="ex: Mistral Small 3 (Rapide)"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Description / Points forts
                </label>
                <textarea
                  rows={2}
                  value={modelForm.description}
                  onChange={e => setModelForm({ ...modelForm, description: e.target.value })}
                  placeholder="ex: Idéal pour concevoir rapidement des interfaces et des schémas SQL."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C4622D]"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <label className="font-bold text-[#1A0E0A] uppercase tracking-wider text-[10px] block">
                  Abonnements autorisés
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  Si aucune case n'est cochée, le modèle est disponible dès le forfait Gratuit.
                </p>
                <div className="flex gap-4">
                  {["pro", "enterprise"].map((plan) => {
                    const checked = modelForm.allowed_plans.includes(plan);
                    return (
                      <label key={plan} className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-xs uppercase">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlanInForm(plan)}
                          className="rounded text-[#C4622D] focus:ring-[#C4622D]"
                        />
                        <span>{plan}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={modelForm.is_default}
                    onChange={e => setModelForm({ ...modelForm, is_default: e.target.checked })}
                    className="rounded text-[#C4622D] focus:ring-[#C4622D]"
                  />
                  <span>Modèle par défaut</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={modelForm.is_active}
                    onChange={e => setModelForm({ ...modelForm, is_active: e.target.checked })}
                    className="rounded text-[#C4622D] focus:ring-[#C4622D]"
                  />
                  <span>Actif dans la palette</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C4622D] hover:bg-[#A85122] text-white rounded-xl font-bold shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

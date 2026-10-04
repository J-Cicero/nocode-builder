import axios from "./axios";

export const aiApi = {
  chat: (projectId, payload) => axios.post(`/ai/projects/${projectId}/chat`, payload),
  history: (projectId) => axios.get(`/ai/projects/${projectId}/history`),
  clearHistory: (projectId) => axios.delete(`/ai/projects/${projectId}/history`),
  generateSchema: (projectId, payload) =>
    axios.post(`/ai/projects/${projectId}/generate-schema`, payload),
  generateInterface: (projectId, payload) =>
    axios.post(`/ai/projects/${projectId}/generate-interface`, payload),
  generateApp: (projectId, payload) =>
    axios.post(`/ai/projects/${projectId}/generate-app`, payload),
  // Palette de modèles d'IA disponibles
  getModels: () => axios.get("/ai/models"),
  // Administration dynamique des fournisseurs & modèles (réservé aux admins)
  getAdminProviders: () => axios.get("/ai/admin/providers"),
  createAdminProvider: (payload) => axios.post("/ai/admin/providers", payload),
  updateAdminProvider: (id, payload) => axios.patch(`/ai/admin/providers/${id}`, payload),
  deleteAdminProvider: (id) => axios.delete(`/ai/admin/providers/${id}`),
  testAdminProvider: (id) => axios.post(`/ai/admin/providers/${id}/test`),
  getAdminModels: () => axios.get("/ai/admin/models"),
  createAdminModel: (payload) => axios.post("/ai/admin/models", payload),
  updateAdminModel: (id, payload) => axios.patch(`/ai/admin/models/${id}`, payload),
  deleteAdminModel: (id) => axios.delete(`/ai/admin/models/${id}`),
  testAdminModel: (id) => axios.post(`/ai/admin/models/${id}/test`),
};

export default aiApi;

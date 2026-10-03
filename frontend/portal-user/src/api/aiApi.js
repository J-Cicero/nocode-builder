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
};

export default aiApi;

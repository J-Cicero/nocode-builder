import axios from "./axios";

export const generatorApi = {
  generate: (projectId, payload) => axios.post(`/generator/${projectId}`, payload),
  list: (projectId) => axios.get(`/generator/${projectId}`),
  getById: (trackingId) => axios.get(`/generator/generation/${trackingId}`),
  download: (trackingId) =>
    axios.get(`/generator/download/${trackingId}`, { responseType: "blob" }),
  deployPreview: (projectId) => axios.post(`/generator/${projectId}/deploy-preview`),
  deploy: (projectId) => axios.post("/generator/deploy", { project_id: projectId }),
};

export default generatorApi;

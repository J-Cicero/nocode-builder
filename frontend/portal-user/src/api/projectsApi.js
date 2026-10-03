import axios from "./axios";

export const projectsApi = {
  getAll: () => axios.get("/projects/"),
  getById: (tracking_id) => axios.get(`/projects/${tracking_id}`),
  create: (payload) => axios.post("/projects/", payload),
  update: (tracking_id, updates) => axios.patch(`/projects/${tracking_id}`, updates),
  updateStatus: (tracking_id, status) =>
    axios.patch(`/projects/${tracking_id}/status`, { status }),
  delete: (tracking_id) => axios.delete(`/projects/${tracking_id}`),
  duplicate: (tracking_id) => axios.post(`/projects/${tracking_id}/duplicate`),
};

export default projectsApi;

import axios from "./axios";

export const workflowsApi = {
  list: (projectId) => axios.get(`/workflows/${projectId}`),
  create: (projectId, payload) => axios.post(`/workflows/${projectId}`, payload),
  update: (trackingId, payload) => axios.patch(`/workflows/${trackingId}`, payload),
  remove: (trackingId) => axios.delete(`/workflows/${trackingId}`),
  executions: (workflowId) => axios.get(`/workflows/${workflowId}/executions`),
  getGraph: (workflowId) => axios.get(`/workflows/${workflowId}/graph`),
  saveGraph: (workflowId, payload) => axios.put(`/workflows/${workflowId}/graph`, payload),
};

export default workflowsApi;

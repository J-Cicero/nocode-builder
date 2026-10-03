import axios from "./axios";

export const schemaApi = {
  getSchema: (projectId) => axios.get(`/schema/projects/${projectId}`),
  listTables: (projectId) => axios.get(`/schema/projects/${projectId}/tables`),
  createTable: (projectId, payload) =>
    axios.post(`/schema/projects/${projectId}/tables`, payload),
  updateTable: (tableId, payload) => axios.patch(`/schema/tables/${tableId}`, payload),
  deleteTable: (tableId) => axios.delete(`/schema/tables/${tableId}`),
  listFields: (tableId) => axios.get(`/schema/tables/${tableId}/fields`),
  createField: (tableId, payload) => axios.post(`/schema/tables/${tableId}/fields`, payload),
  updateField: (fieldId, payload) => axios.patch(`/schema/fields/${fieldId}`, payload),
  deleteField: (fieldId) => axios.delete(`/schema/fields/${fieldId}`),
  listRelations: (projectId) => axios.get(`/schema/projects/${projectId}/relations`),
  createRelation: (projectId, payload) =>
    axios.post(`/schema/projects/${projectId}/relations`, payload),
  updateRelation: (relationId, payload) =>
    axios.patch(`/schema/relations/${relationId}`, payload),
  deleteRelation: (relationId) => axios.delete(`/schema/relations/${relationId}`),
};

export default schemaApi;

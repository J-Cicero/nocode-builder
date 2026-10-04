import axios from "./axios";

export const interfaceApi = {
  getInterface: (projectId) => axios.get(`/interface/${projectId}`),
  createPage: (projectId, payload) => axios.post(`/interface/${projectId}/pages`, payload),
  updatePage: (pageId, payload) => axios.patch(`/interface/pages/${pageId}`, payload),
  deletePage: (pageId) => axios.delete(`/interface/pages/${pageId}`),
  createComponent: (pageId, payload) => axios.post(`/interface/pages/${pageId}/composants`, payload),
  updateComponent: (componentId, payload) => axios.patch(`/interface/composants/${componentId}`, payload),
  deleteComponent: (componentId) => axios.delete(`/interface/composants/${componentId}`),
  reorderComponents: (pageId, payload) => axios.post(`/interface/pages/${pageId}/composants/reorder`, payload),
  getPageSections: (pageId) => axios.get(`/interface/pages/${pageId}/sections`),
  createSection: (pageId, payload) => axios.post(`/interface/pages/${pageId}/sections`, payload),
  updateSection: (sectionId, payload) => axios.patch(`/interface/sections/${sectionId}`, payload),
  deleteSection: (sectionId) => axios.delete(`/interface/sections/${sectionId}`),
};

export default interfaceApi;

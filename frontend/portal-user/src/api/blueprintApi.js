/**
 * Blueprint API Service
 * 
 * Toutes les communications avec le backend FastAPI pour les Blueprints.
 * Base URL : REACT_APP_API_BASE_URL/v1
 * Aucun ID SQL n'est jamais transmis — uniquement des UUID.
 */
import axios from "./axios";

const V1 = "/v1";

export const blueprintApi = {
  // ── Workspaces ───────────────────────────────────────────────────────────
  getWorkspaces: () =>
    axios.get(`${V1}/workspaces/`),

  getWorkspace: (uuid) =>
    axios.get(`${V1}/workspaces/${uuid}`),

  createWorkspace: (payload) =>
    axios.post(`${V1}/workspaces/`, payload),

  // ── Projects ─────────────────────────────────────────────────────────────
  getProjects: () =>
    axios.get(`${V1}/projects/`),

  getProject: (uuid) =>
    axios.get(`${V1}/projects/${uuid}`),

  getProjectBlueprints: (projectUuid) =>
    axios.get(`${V1}/projects/${projectUuid}/blueprints`),

  createProject: (payload) =>
    axios.post(`${V1}/projects/`, payload),

  // ── Blueprints ────────────────────────────────────────────────────────────
  getBlueprint: (uuid) =>
    axios.get(`${V1}/blueprints/${uuid}`),

  /**
   * Sauvegarde complète du Blueprint.
   * @param {string} uuid UUID du blueprint
   * @param {{ version: number, content: object }} payload
   */
  saveBlueprint: (uuid, payload) =>
    axios.put(`${V1}/blueprints/${uuid}`, payload),

  createBlueprint: (payload) =>
    axios.post(`${V1}/blueprints/`, payload),
};

export default blueprintApi;

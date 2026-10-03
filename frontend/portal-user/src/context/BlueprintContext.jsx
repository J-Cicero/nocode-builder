import React, { createContext, useCallback, useContext, useReducer } from "react";
import blueprintApi from "../api/blueprintApi";

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  /** @type {import('../types/blueprint').BlueprintEntity|null} */
  blueprint: null,
  loading: false,
  saving: false,
  dirty: false,
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, blueprint: action.payload, dirty: false };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SAVE_START":
      return { ...state, saving: true, error: null };
    case "SAVE_SUCCESS":
      return { ...state, saving: false, blueprint: action.payload, dirty: false };
    case "SAVE_ERROR":
      return { ...state, saving: false, error: action.payload };

    case "UPDATE_CONTENT":
      if (!state.blueprint) return state;
      return {
        ...state,
        dirty: true,
        blueprint: {
          ...state.blueprint,
          content: action.payload,
        },
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BlueprintContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BlueprintProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Charge un Blueprint depuis l'API par son UUID.
   * @param {string} blueprintUuid
   */
  const loadBlueprint = useCallback(async (blueprintUuid) => {
    dispatch({ type: "LOAD_START" });
    try {
      const { data } = await blueprintApi.getBlueprint(blueprintUuid);
      dispatch({ type: "LOAD_SUCCESS", payload: data });
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || "Erreur lors du chargement";
      dispatch({ type: "LOAD_ERROR", payload: message });
    }
  }, []);

  /**
   * Charge le Blueprint d'un projet depuis l'API par son projectUuid.
   * Prend la version la plus récente.
   */
  const loadBlueprintByProject = useCallback(async (projectUuid) => {
    if (!projectUuid) return;
    dispatch({ type: "LOAD_START" });
    try {
      const { data } = await blueprintApi.getProjectBlueprints(projectUuid);
      const list = Array.isArray(data) ? data : data?.blueprints ?? data?.items ?? [];
      if (list.length === 0) {
        dispatch({ type: "LOAD_SUCCESS", payload: null });
        return;
      }
      const latest = list.reduce((best, current) =>
        (current.version ?? 0) > (best.version ?? 0) ? current : best
      );
      dispatch({ type: "LOAD_SUCCESS", payload: latest });
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || "Erreur chargement Blueprint";
      dispatch({ type: "LOAD_ERROR", payload: message });
    }
  }, []);

  /**
   * Met à jour le contenu local du Blueprint (marque dirty = true).
   * @param {import('../types/blueprint').BlueprintContent} newContent
   */
  const updateContent = useCallback((newContent) => {
    dispatch({ type: "UPDATE_CONTENT", payload: newContent });
  }, []);

  /**
   * Sauvegarde le Blueprint actuel vers l'API.
   */
  const saveBlueprint = useCallback(async () => {
    if (!state.blueprint) return;
    dispatch({ type: "SAVE_START" });
    try {
      const { data } = await blueprintApi.saveBlueprint(state.blueprint.uuid, {
        version: state.blueprint.version + 1,
        content: state.blueprint.content,
      });
      dispatch({ type: "SAVE_SUCCESS", payload: data });
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || "Erreur lors de la sauvegarde";
      dispatch({ type: "SAVE_ERROR", payload: message });
    }
  }, [state.blueprint]);

  /**
   * Réinitialise le contexte (retour à l'état initial).
   */
  const resetBlueprint = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  /** @type {import('../types/blueprint').BlueprintContextValue} */
  const value = {
    blueprint: state.blueprint,
    loading: state.loading,
    saving: state.saving,
    dirty: state.dirty,
    error: state.error,
    loadBlueprint,
    loadBlueprintByProject,
    updateContent,
    saveBlueprint,
    resetBlueprint,
  };

  return (
    <BlueprintContext.Provider value={value}>
      {children}
    </BlueprintContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @returns {import('../types/blueprint').BlueprintContextValue}
 */
export function useBlueprint() {
  const ctx = useContext(BlueprintContext);
  if (!ctx) {
    throw new Error("useBlueprint doit être utilisé dans un <BlueprintProvider>");
  }
  return ctx;
}

export default BlueprintContext;

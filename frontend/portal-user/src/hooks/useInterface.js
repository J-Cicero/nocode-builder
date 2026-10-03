import { useCallback, useEffect, useState } from "react";
import interfaceApi from "../api/interfaceApi";

const byOrdre = (a, b) => (a?.ordre ?? 0) - (b?.ordre ?? 0);

/**
 * useInterface — Gestionnaire de l'interface du Système B
 * Source unique de vérité pour les Pages, Sections et Composants du projet.
 */
export function useInterface(projectId) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hydrate = useCallback(
    async (pid = projectId) => {
      if (!pid) return;

      setLoading(true);
      setError(null);
      try {
        const { data } = await interfaceApi.getInterface(pid);
        const pageList = (data.pages || []).slice().sort(byOrdre);
        setPages(pageList);
      } catch (err) {
        setError(err?.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const createPage = useCallback(
    async (payload) => {
      const { data } = await interfaceApi.createPage(projectId, payload);
      setPages((prev) => [...prev, data].sort(byOrdre));
      return data;
    },
    [projectId]
  );

  const updatePage = useCallback(async (pageId, updates) => {
    const { data } = await interfaceApi.updatePage(pageId, updates);
    setPages((prev) =>
      prev.map((p) => (p.tracking_id === pageId ? { ...p, ...data } : p))
    );
    return data;
  }, []);

  const deletePage = useCallback(async (pageId) => {
    await interfaceApi.deletePage(pageId);
    setPages((prev) => prev.filter((p) => p.tracking_id !== pageId));
  }, []);

  const createComponent = useCallback(async (pageId, payload) => {
    const { data } = await interfaceApi.createComponent(pageId, payload);
    setPages((prev) =>
      prev.map((page) => {
        if (page.tracking_id === pageId) {
          const comps = [...(page.composants || []), data];
          return { ...page, composants: comps };
        }
        return page;
      })
    );
    return data;
  }, []);

  const updateComponent = useCallback(async (compId, updates) => {
    const { data } = await interfaceApi.updateComponent(compId, updates);
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        composants: (page.composants || []).map((c) =>
          c.tracking_id === compId ? { ...c, ...data } : c
        ),
      }))
    );
    return data;
  }, []);

  const deleteComponent = useCallback(async (compId) => {
    await interfaceApi.deleteComponent(compId);
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        composants: (page.composants || []).filter((c) => c.tracking_id !== compId),
      }))
    );
  }, []);

  return {
    pages,
    loading,
    error,
    hydrate,
    createPage,
    updatePage,
    deletePage,
    createComponent,
    updateComponent,
    deleteComponent,
    setPages,
  };
}

export default useInterface;

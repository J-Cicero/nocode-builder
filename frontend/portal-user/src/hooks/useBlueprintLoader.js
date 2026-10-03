import { useEffect, useState, useCallback } from "react";
import blueprintApi from "../api/blueprintApi";

/**
 * useBlueprintLoader — Prototype Phase 1 (Sprint 4.5)
 *
 * Charge le Blueprint associé à un projet V0 via son uuid.
 * LECTURE SEULE — aucune modification, aucune persistance.
 *
 * Stratégie :
 *   1. Appelle blueprintApi.getProjectBlueprints(projectUuid)
 *   2. Prend le premier Blueprint trouvé (version la plus récente)
 *   3. Expose le Blueprint brut pour inspection dans EditorPage
 *
 * Ce hook ne remplace PAS useInterface — il est complémentaire.
 * Il sera retiré quand la Phase 2 sera complète.
 *
 * @param {string|null} projectUuid UUID du projet (champ "uuid" de l'objet Project V1)
 * @returns {{ blueprint: object|null, loading: boolean, error: string|null, reload: function }}
 */
export function useBlueprintLoader(projectUuid) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (uuid) => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      // Charge tous les blueprints du projet
      const { data } = await blueprintApi.getProjectBlueprints(uuid);
      
      // L'API retourne soit un tableau, soit un objet avec blueprints[]
      const list = Array.isArray(data)
        ? data
        : data?.blueprints ?? data?.items ?? [];

      if (list.length === 0) {
        // Pas encore de Blueprint pour ce projet — cas normal en V0
        setBlueprint(null);
        return;
      }

      // Prendre le Blueprint avec la version la plus élevée
      const latest = list.reduce((best, current) =>
        (current.version ?? 0) > (best.version ?? 0) ? current : best
      );

      setBlueprint(latest);
      console.log(
        `[useBlueprintLoader] Blueprint chargé — version ${latest.version}, uuid: ${latest.uuid}`
      );
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Erreur chargement Blueprint";
      console.warn("[useBlueprintLoader] Blueprint non disponible:", msg);
      // Ne pas remonter l'erreur comme critique — le projet peut ne pas avoir de Blueprint
      setError(null);
      setBlueprint(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(projectUuid);
  }, [projectUuid, load]);

  return {
    blueprint,
    loading,
    error,
    reload: () => load(projectUuid),
  };
}

export default useBlueprintLoader;

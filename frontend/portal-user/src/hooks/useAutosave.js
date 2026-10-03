import { useEffect, useRef } from "react";
import { useBlueprint } from "../context/BlueprintContext";

const DEBOUNCE_MS = 2000;

/**
 * Hook d'autosauvegarde du Blueprint.
 * - Surveille dirty
 * - Attend 2 secondes après la dernière modification
 * - Appelle saveBlueprint() automatiquement
 */
export function useAutosave() {
  const { dirty, saving, saveBlueprint } = useBlueprint();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!dirty || saving) return;

    // Annuler le timer précédent
    if (timerRef.current) clearTimeout(timerRef.current);

    // Démarrer un nouveau debounce
    timerRef.current = setTimeout(() => {
      saveBlueprint();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dirty, saving, saveBlueprint]);
}

export default useAutosave;

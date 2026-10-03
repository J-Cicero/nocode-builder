import React, { createContext, useCallback, useContext, useState } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

const SelectionContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SelectionProvider({ children }) {
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  /**
   * Sélectionne une page (désélectionne section et composant).
   * @param {string} pageId UUID de la page
   */
  const selectPage = useCallback((pageId) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(null);
    setSelectedComponentId(null);
  }, []);

  /**
   * Sélectionne une section (désélectionne le composant).
   * @param {string} sectionId UUID de la section
   */
  const selectSection = useCallback((sectionId) => {
    setSelectedSectionId(sectionId);
    setSelectedComponentId(null);
  }, []);

  /**
   * Sélectionne un composant.
   * @param {string} componentId UUID du composant
   */
  const selectComponent = useCallback((componentId) => {
    setSelectedComponentId(componentId);
  }, []);

  /**
   * Désélectionne tout.
   */
  const clearSelection = useCallback(() => {
    setSelectedPageId(null);
    setSelectedSectionId(null);
    setSelectedComponentId(null);
  }, []);

  /** @type {import('../types/blueprint').SelectionContextValue} */
  const value = {
    selectedPageId,
    selectedSectionId,
    selectedComponentId,
    selectPage,
    selectSection,
    selectComponent,
    clearSelection,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @returns {import('../types/blueprint').SelectionContextValue}
 */
export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection doit être utilisé dans un <SelectionProvider>");
  }
  return ctx;
}

export default SelectionContext;

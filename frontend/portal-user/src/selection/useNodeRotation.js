import React, { useCallback, useState, useEffect } from "react";
import { useSelectedNode } from "./SelectionProvider";

/**
 * Hook réactif pour obtenir et modifier la rotation (transform: rotate)
 * du nœud actuellement sélectionné.
 */
export default function useNodeRotation() {
  const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
  const [rotation, setRotationState] = useState(0);

  // Utiliser une ref pour getSelectedNode
  const getSelectedNodeRef = React.useRef(getSelectedNode);
  React.useEffect(() => {
    getSelectedNodeRef.current = getSelectedNode;
  }, [getSelectedNode]);

  // Extraire la rotation depuis le transform
  const extractRotation = useCallback((transform) => {
    if (!transform || typeof transform !== 'string') return 0;
    const match = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  }, []);

  // Synchroniser avec le nœud sélectionné
  useEffect(() => {
    if (selectedNodeId) {
      const node = getSelectedNodeRef.current();
      if (node && node.style) {
        const currentRotation = extractRotation(node.style.transform);
        setRotationState(currentRotation);
      }
    } else {
      setRotationState(0);
    }
  }, [selectedNodeId, extractRotation]);

  // Fonction pour définir une rotation absolue
  const setRotation = useCallback((degrees) => {
    if (!selectedNodeId) return;

    const normalized = degrees % 360;
    updateSelectedNodeStyle({
      transform: `rotate(${normalized}deg)`
    });
    setRotationState(normalized);
  }, [selectedNodeId, updateSelectedNodeStyle]);

  // Fonction pour ajouter une rotation relative
  const addRotation = useCallback((degrees) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
  }, [rotation, setRotation]);

  // Fonctions de flip
  const flipHorizontal = useCallback(() => {
    const newRotation = (180 - rotation) % 360;
    setRotation(newRotation);
  }, [rotation, setRotation]);

  const flipVertical = useCallback(() => {
    const newRotation = (360 - rotation) % 360;
    setRotation(newRotation);
  }, [rotation, setRotation]);

  // Réinitialiser la rotation
  const resetRotation = useCallback(() => {
    setRotation(0);
  }, [setRotation]);

  return {
    rotation,
    setRotation,
    addRotation,
    flipHorizontal,
    flipVertical,
    resetRotation,
    hasSelectedNode: !!selectedNodeId
  };
}

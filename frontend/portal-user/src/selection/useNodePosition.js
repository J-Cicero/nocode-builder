import React, { useCallback, useEffect, useState } from "react";
import { useSelectedNode } from "./SelectionProvider";

/*
 * Hook réactif pour obtenir et modifier la position (x, y)
 * du nœud actuellement sélectionné.
 */
export default function useNodePosition() {
  const { selectedNodeId, getSelectedNode, updateSelectedNodePosition } = useSelectedNode();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Utiliser une ref pour getSelectedNode
  const getSelectedNodeRef = React.useRef(getSelectedNode);
  React.useEffect(() => {
    getSelectedNodeRef.current = getSelectedNode;
  }, [getSelectedNode]);

  // Synchroniser avec le nœud sélectionné
  useEffect(() => {
    if (selectedNodeId) {
      const node = getSelectedNodeRef.current();
      if (node && node.position) {
        setPosition({ x: node.position.x || 0, y: node.position.y || 0 });
      }
    } else {
      setPosition({ x: 0, y: 0 });
    }
  }, [selectedNodeId]);

  // Fonction pour mettre à jour la position
  const updatePosition = useCallback((newPosition) => {
    if (!selectedNodeId) return;

    const updates = {};
    if (newPosition.x !== undefined) updates.x = newPosition.x;
    if (newPosition.y !== undefined) updates.y = newPosition.y;

    updateSelectedNodePosition(updates);
    setPosition(prev => ({ ...prev, ...updates }));
  }, [selectedNodeId, updateSelectedNodePosition]);

  return {
    position,
    setPosition: updatePosition,
    hasSelectedNode: !!selectedNodeId
  };
}

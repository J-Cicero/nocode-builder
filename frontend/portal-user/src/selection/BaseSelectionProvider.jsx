/*
 * Provider de base pour la sélection sans dépendance React Flow
 */

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const BaseSelectionContext = createContext(null);

export function BaseSelectionProvider({ children }) {
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    // Store de base pour les informations des nœuds
    const [nodeInfoStore, setNodeInfoStore] = useState(new Map());

    // Handler compatible avec ReactFlow onSelectionChange
    const onFlowSelectionChange = useCallback(({ nodes }) => {
        const first = Array.isArray(nodes) && nodes.length > 0 ? nodes[0] : null;
        setSelectedNodeId(first?.id ?? null);
    }, []);

    // Fonction pour mettre à jour les informations d'un nœud dans le store local
    const updateNodeInfo = useCallback((nodeId, info) => {
        setNodeInfoStore(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(nodeId) || {};
            newMap.set(nodeId, { ...existing, ...info });
            return newMap;
        });
    }, []);

    // Fonction pour obtenir les informations d'un nœud depuis le store local
    const getNodeInfo = useCallback((nodeId) => {
        return nodeInfoStore.get(nodeId) || null;
    }, [nodeInfoStore]);

    // Fonction pour obtenir les informations du nœud sélectionné
    const getSelectedNodeInfo = useCallback(() => {
        return selectedNodeId ? getNodeInfo(selectedNodeId) : null;
    }, [selectedNodeId, getNodeInfo]);

    const value = useMemo(
        () => ({
            selectedNodeId,
            setSelectedNodeId,
            onFlowSelectionChange,
            clearSelection: () => setSelectedNodeId(null),
            // Nouvelles fonctions pour gérer les informations des nœuds
            updateNodeInfo,
            getNodeInfo,
            getSelectedNodeInfo,
        }),
        [selectedNodeId, onFlowSelectionChange, updateNodeInfo, getNodeInfo, getSelectedNodeInfo]
    );

    return (
        <BaseSelectionContext.Provider value={value}>
            {children}
        </BaseSelectionContext.Provider>
    );
}

export function useBaseSelection() {
    const context = useContext(BaseSelectionContext);
    if (!context) {
        throw new Error("useBaseSelection must be used within BaseSelectionProvider");
    }
    return context;
}

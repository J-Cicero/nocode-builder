/*
*contexte + provider pour l'ID sélectionné avec fonctionnalités React Flow
* */

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useBaseSelection } from "./BaseSelectionProvider";

const ReactFlowSelectionContext = createContext(null);

// Provider qui fournit les fonctions React Flow
export function ReactFlowSelectionProvider({ children, onPersistNodeUpdate, onPersistNodeDelete }) {
    const baseSelection = useBaseSelection();
    const reactFlowInstance = useReactFlow();

    // Mémoriser les callbacks de persistance
    const onPersistNodeUpdateRef = React.useRef(onPersistNodeUpdate);
    React.useEffect(() => {
        onPersistNodeUpdateRef.current = onPersistNodeUpdate;
    }, [onPersistNodeUpdate]);

    const onPersistNodeDeleteRef = React.useRef(onPersistNodeDelete);
    React.useEffect(() => {
        onPersistNodeDeleteRef.current = onPersistNodeDelete;
    }, [onPersistNodeDelete]);

    // Mémoriser l'instance pour éviter les boucles
    const reactFlowRef = React.useRef(reactFlowInstance);
    React.useEffect(() => {
        reactFlowRef.current = reactFlowInstance;
    }, [reactFlowInstance]);

    // Fonction pour obtenir le nœud sélectionné
    const getSelectedNode = useCallback(() => {
        if (!baseSelection.selectedNodeId) {
            return null;
        }

        // Essayer d'abord avec la ref globale (plus fiable)
        if (window.__reactFlowNodes && window.__reactFlowNodes.current) {
            const nodes = window.__reactFlowNodes.current;
            const foundNode = nodes.find(node => node.id === baseSelection.selectedNodeId);
            if (foundNode) {
                return foundNode;
            }
        }

        return null;
    }, [baseSelection.selectedNodeId]);

    // Fonction pour mettre à jour le style d'un nœud spécifique
    // IMPORTANT: React Flow n'expose pas node.style en tant que prop aux composants custom.
    // On stocke les styles dans node.data.styles pour qu'ils soient accessibles via props.data.styles.
    const updateNodeStyle = useCallback((nodeId, styleUpdates, persist = true) => {
        console.log('🎨 updateNodeStyle appelé', { nodeId, styleUpdates, persist });

        if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
            const setNodes = window.__reactFlowSetNodes.current;

            setNodes((nodes) => {
                return nodes.map((node) => {
                    if (node.id === nodeId) {
                        // Fusionner les styles dans data.styles (accessible par les composants)
                        const mergedStyles = {
                            ...(node.data?.styles || {}),
                            ...styleUpdates,
                        };
                        const updatedNode = {
                            ...node,
                            // node.style : pour la taille du wrapper ReactFlow (width/height uniquement)
                            style: {
                                ...node.style,
                                ...(styleUpdates.width ? { width: styleUpdates.width } : {}),
                                ...(styleUpdates.height ? { height: styleUpdates.height } : {}),
                            },
                            // data.styles : pour tous les styles visuels consommés par le composant
                            data: {
                                ...node.data,
                                styles: mergedStyles,
                            },
                        };
                        
                        // Persistance automatique si demandée
                        if (persist && onPersistNodeUpdateRef.current) {
                            const persistenceUpdates = { styles: mergedStyles };
                            if (styleUpdates.width) persistenceUpdates.largeur = styleUpdates.width;
                            if (styleUpdates.height) persistenceUpdates.hauteur = styleUpdates.height;
                            onPersistNodeUpdateRef.current(nodeId, persistenceUpdates);
                        }
                        
                        return updatedNode;
                    }
                    return node;
                });
            });
        }
    }, []);

    // Fonction pour mettre à jour le style du nœud sélectionné
    const updateSelectedNodeStyle = useCallback((styleUpdates, persist = true) => {
        if (!baseSelection.selectedNodeId) {
            return;
        }

        updateNodeStyle(baseSelection.selectedNodeId, styleUpdates, persist);
    }, [baseSelection.selectedNodeId, updateNodeStyle]);

    // Fonction pour mettre à jour la position d'un nœud spécifique
    const updateNodePosition = useCallback((nodeId, positionUpdates, persist = true) => {
        if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
            const setNodes = window.__reactFlowSetNodes.current;
            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === nodeId) {
                        const updatedNode = {
                            ...node,
                            position: {
                                ...node.position,
                                ...positionUpdates,
                            },
                        };

                        if (persist && onPersistNodeUpdateRef.current) {
                            onPersistNodeUpdateRef.current(nodeId, { 
                                position_x: Math.round(updatedNode.position.x),
                                position_y: Math.round(updatedNode.position.y)
                            });
                        }

                        return updatedNode;
                    }
                    return node;
                })
            );
        }
    }, []);

    // Fonction pour mettre à jour la position du nœud sélectionné
    const updateSelectedNodePosition = useCallback((positionUpdates, persist = true) => {
        if (!baseSelection.selectedNodeId) return;
        updateNodePosition(baseSelection.selectedNodeId, positionUpdates, persist);
    }, [baseSelection.selectedNodeId, updateNodePosition]);

    // Fonction pour supprimer le nœud sélectionné
    const deleteSelectedNode = useCallback(() => {
        if (!baseSelection.selectedNodeId) return;

        const nodeId = baseSelection.selectedNodeId;
        if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
            window.__reactFlowSetNodes.current((nodes) =>
                nodes.filter((node) => node.id !== nodeId)
            );
            
            if (onPersistNodeDeleteRef.current) {
                onPersistNodeDeleteRef.current(nodeId);
            }
        }
        baseSelection.setSelectedNodeId(null);
    }, [baseSelection]);

    // Fonction pour mettre à jour les données d'un nœud
    const updateNodeData = useCallback((nodeId, dataUpdates, persist = true) => {
        if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
            const setNodes = window.__reactFlowSetNodes.current;
            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === nodeId) {
                        const updatedNode = {
                            ...node,
                            data: {
                                ...node.data,
                                ...dataUpdates,
                            },
                        };

                        if (persist && onPersistNodeUpdateRef.current) {
                            // On persiste le champ 'config' du composant
                            onPersistNodeUpdateRef.current(nodeId, { 
                                config: {
                                    ...(updatedNode.data.component?.config || {}),
                                    props: {
                                        ...(updatedNode.data.component?.config?.props || {}),
                                        ...(dataUpdates.props || {})
                                    },
                                    label: dataUpdates.label || updatedNode.data.label
                                }
                            });
                        }

                        return updatedNode;
                    }
                    return node;
                })
            );
        }
    }, []);

    // Fonction pour mettre à jour les données du nœud sélectionné
    const updateSelectedNodeData = useCallback((dataUpdates, persist = true) => {
        if (!baseSelection.selectedNodeId) return;
        updateNodeData(baseSelection.selectedNodeId, dataUpdates, persist);
    }, [baseSelection.selectedNodeId, updateNodeData]);

    const value = useMemo(
        () => ({
            // Hérite des fonctionnalités de base
            ...baseSelection,
            // Fonctions React Flow
            getSelectedNode,
            updateNodeStyle,
            updateSelectedNodeStyle,
            updateNodePosition,
            updateSelectedNodePosition,
            deleteSelectedNode,
            updateNodeData,
            updateSelectedNodeData,
        }),
        [
            baseSelection,
            getSelectedNode,
            updateNodeStyle,
            updateSelectedNodeStyle,
            updateNodePosition,
            updateSelectedNodePosition,
            deleteSelectedNode,
            updateNodeData,
            updateSelectedNodeData,
        ]
    );

    return (
        <ReactFlowSelectionContext.Provider value={value}>
            {children}
        </ReactFlowSelectionContext.Provider>
    );
}

export function useReactFlowSelection() {
    const context = useContext(ReactFlowSelectionContext);
    if (!context) {
        throw new Error("useReactFlowSelection must be used within ReactFlowSelectionProvider");
    }
    return context;
}

// Provider combiné qui utilise BaseSelectionProvider
export function SelectionProvider({ children }) {
    return children;
}

// Hook principal qui utilise les fonctionnalités React Flow si disponibles, sinon les fonctionnalités de base
export function useSelectedNode() {
    const baseSelection = useBaseSelection();
    const reactFlowSelection = useContext(ReactFlowSelectionContext);

    // Fallback fonctionnel basé sur les refs globales window.__reactFlowNodes/__reactFlowSetNodes
    const fallbackSelection = useMemo(() => {
        // Helper pour récupérer le tableau des nœuds depuis la ref globale
        const getNodesArray = () => {
            const ref = window.__reactFlowNodes;
            return ref && ref.current ? ref.current : [];
        };

        // Helper pour setNodes via la ref globale
        const withSetNodes = (updater) => {
            const setRef = window.__reactFlowSetNodes;
            if (setRef && typeof setRef.current === 'function') {
                setRef.current(updater);
                return true;
            }
            return false;
        };

        const getSelectedNode = () => {
            const id = baseSelection.selectedNodeId;
            if (!id) return null;
            const nodes = getNodesArray();
            return nodes.find(n => n.id === id) || null;
        };

        const updateNodeStyle = (nodeId, styleUpdates) => {
            withSetNodes((nodes) => nodes.map((node) => {
                if (node.id !== nodeId) return node;
                const mergedStyles = { ...(node.data?.styles || {}), ...styleUpdates };
                return {
                    ...node,
                    style: {
                        ...node.style,
                        ...(styleUpdates.width ? { width: styleUpdates.width } : {}),
                        ...(styleUpdates.height ? { height: styleUpdates.height } : {}),
                    },
                    data: { ...node.data, styles: mergedStyles },
                };
            }));
        };

        const updateSelectedNodeStyle = (styleUpdates) => {
            const id = baseSelection.selectedNodeId;
            if (!id) return;
            updateNodeStyle(id, styleUpdates);
        };

        const updateNodePosition = (nodeId, positionUpdates) => {
            withSetNodes((nodes) => nodes.map((node) => {
                if (node.id !== nodeId) return node;
                return { ...node, position: { ...node.position, ...positionUpdates } };
            }));
        };

        const updateSelectedNodePosition = (positionUpdates) => {
            const id = baseSelection.selectedNodeId;
            if (!id) return;
            updateNodePosition(id, positionUpdates);
        };

        const deleteSelectedNode = () => {
            const id = baseSelection.selectedNodeId;
            if (!id) return;
            withSetNodes((nodes) => nodes.filter((n) => n.id !== id));
            baseSelection.setSelectedNodeId(null);
        };

        const updateNodeData = (nodeId, dataUpdates) => {
            withSetNodes((nodes) => nodes.map((node) => {
                if (node.id !== nodeId) return node;
                return { ...node, data: { ...node.data, ...dataUpdates } };
            }));
        };

        const updateSelectedNodeData = (dataUpdates) => {
            const id = baseSelection.selectedNodeId;
            if (!id) return;
            updateNodeData(id, dataUpdates);
        };

        return {
            ...baseSelection,
            getSelectedNode,
            updateSelectedNodePosition,
            updateSelectedNodeStyle,
            deleteSelectedNode,
            updateNodeStyle,
            updateNodePosition,
            updateNodeData,
            updateSelectedNodeData,
        };
    }, [baseSelection]);

    // Si React Flow est disponible, retourne les fonctionnalités complètes
    if (reactFlowSelection) {
        return reactFlowSelection;
    }

    return fallbackSelection;
}
/*
* point d'entrer du package
* */

// src/packages/selection/index.js
export { BaseSelectionProvider } from "./BaseSelectionProvider";
export { SelectionProvider, ReactFlowSelectionProvider, useSelectedNode } from "./SelectionProvider";
export { default as useNodeColor } from "./useNodeColor";
export { default as useNodeBackgroundColor } from "./useNodeBackgroundColor";
export { default as useNodeBorderColor } from "./useNodeBorderColor";
export { default as useNodeTextColor } from "./useNodeTextColor";
export { default as useNodePosition } from "./useNodePosition";
export { default as useNodeRotation } from "./useNodeRotation";

// Utilitaires pour récupérer les propriétés des nœuds
export {
    getNodeProperties,
    getNodeColors,
    getNodePosition,
    getNodeLayout,
    getNodeAppearance,
    getNodeData,
    formatPropertiesForDisplay
} from "./getPropriete";

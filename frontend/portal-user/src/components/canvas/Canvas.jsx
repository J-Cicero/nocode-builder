// src/components/canvas/Canvas.jsx
import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { nodeTypes } from "../../constants/nodeTypes";
import { useSelectedNode } from "../../selection";
import WorkspaceViewport from "./WorkspaceViewport";

let id = 0;
const getId = () => `node_${id++}`;

/**
 * Composant Canvas principal utilisant React Flow
 * Navigation libre (zoom, pan) avec espace de travail délimité pour les pages
 */
export default function Canvas({ canvasHeight }) {
  // État local pour les nodes et edges
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Hooks React Flow
  const { screenToFlowPosition, addNodes } = useReactFlow();
  const { onFlowSelectionChange, setSelectedNodeId } = useSelectedNode();

  /**
   * Gestionnaire des changements de nodes
   */
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  /**
   * Gestionnaire des changements d'edges
   */
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  /**
   * Gestionnaire du drag over pour le drop de composants
   */
  const onDragOver = useCallback((evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  }, []);

  /**
   * Gestionnaire du drop de composants depuis la palette
   */
  const onDrop = useCallback(
    (evt) => {
      evt.preventDefault();
      const type = evt.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });

      // Création d'un nouveau node
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: type },
      };

      addNodes(newNode);
    },
    [screenToFlowPosition, addNodes]
  );

  /**
   * Gestionnaire de sélection de node
   */
  const handleNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node?.id ?? null);
  }, [setSelectedNodeId]);

  return (
    <div style={{ height: canvasHeight, width: "100%", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onFlowSelectionChange}
        onNodeClick={handleNodeClick}
        // Configuration pour navigation libre comme Figma
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        zoomOnPinch={true}
        preventScrolling={false}
        minZoom={0.1} // Zoom minimum pour voir plusieurs pages
        maxZoom={4}   // Zoom maximum pour les détails
        defaultViewport={{
          x: 100, // Position initiale centrée
          y: 100,
          zoom: 0.8, // Zoom initial confortable
        }}
        style={{
          backgroundColor: "#f1f5f9", // Couleur de fond canvas (gris clair)
        }}
      >
        {/* Pages/Viewport - maintenant représente des pages individuelles */}
        <WorkspaceViewport />

        {/* Contrôles de navigation améliorés */}
        <Controls
          style={{
            bottom: "20px",
            left: "20px",
          }}
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />

        {/* Arrière-plan avec grille pour navigation */}
        <Background
          color="#cbd5e1"
          gap={50} // Grille plus large pour navigation
          size={2}
          variant="lines" // Lignes au lieu de points pour meilleure visibilité
        />

        {/* Mini carte pour navigation dans l'espace */}
        <MiniMap
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
          nodeColor="rgba(59, 130, 246, 0.7)"
          maskColor="rgba(241, 245, 249, 0.8)"
          pannable={true} // Permettre la navigation via minimap
          zoomable={true} // Permettre le zoom via minimap
        />
      </ReactFlow>
    </div>
  );
}

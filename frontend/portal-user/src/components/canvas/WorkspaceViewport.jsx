// src/components/canvas/WorkspaceViewport.jsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { nodeTypes } from "../../constants/nodeTypes";
import { useSelectedNode } from "../../selection";
import { ReactFlowSelectionProvider } from "../../selection";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";
import { useSchema } from "../../hooks/useSchema";
import { useToast } from "../../context/ToastContext";
import SectionRenderer from "../sectionsRenderer/SectionRenderer";

/**
 * Composant page canvas avec ReactFlow intégré
 */
function CanvasPage({ initialNodes, initialSections, pageId, isSelected, refreshInterface, updateComponent, createComponent, tables = [] }) {
  const toast = useToast();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sections, setSections] = useState(initialSections || []);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Utiliser une ref pour éviter les écrasements par initialNodes pendant une opération
  const lastInitialNodesRef = useRef(initialNodes);

  useEffect(() => {
    // Ne mettre à jour que si les nœuds initiaux ont réellement changé (par exemple après un refresh global)
    if (JSON.stringify(initialNodes) !== JSON.stringify(lastInitialNodesRef.current)) {
      setNodes(initialNodes);
      lastInitialNodesRef.current = initialNodes;
    }
  }, [initialNodes]);

  // Mettre à jour les sections quand initialSections change
  useEffect(() => {
    console.log('INITIAL SECTIONS PROPS:', initialSections);
    setSections(initialSections || []);
  }, [initialSections]);

  useEffect(() => {
    console.log('SECTIONS STATE UPDATED:', sections);
  }, [sections]);

  // Récupérer les sections de la page pour rafraîchissement
  const fetchSections = useCallback(async () => {
    setIsLoadingSections(true);
    try {
      setSections(initialSections || []);
    } catch (err) {
      console.error("Erreur récupération sections:", err);
      setSections([]);
    } finally {
      setIsLoadingSections(false);
    }
  }, [initialSections]);

  // Exposer fetchSections pour rechargement depuis l'extérieur
  useEffect(() => {
    window.__refetchSections = fetchSections;
  }, [fetchSections]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const { screenToFlowPosition } = useReactFlow();
  const { onFlowSelectionChange, setSelectedNodeId } = useSelectedNode();

  // Créer des refs stables pour les nœuds et setNodes pour la sidebar globale
  const nodesRef = useRef(nodes);
  const setNodesRef = useRef(setNodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    setNodesRef.current = setNodes;
  }, [setNodes]);

  // Exposer les refs au contexte global pour la sidebar de modifications
  useEffect(() => {
    window.__reactFlowNodes = nodesRef;
    window.__reactFlowSetNodes = setNodesRef;
    console.log(`🎯 Références React Flow activées pour la page ${pageId}`);
  }, [pageId]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      nodesRef.current = nextNodes;
      return nextNodes;
    });

    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false) {
        const node = nodesRef.current.find(n => n.id === change.id);
        if (node) {
          updateComponent(node.id, {
            position_x: Math.round(node.position.x),
            position_y: Math.round(node.position.y)
          }).catch(err => console.error("Erreur sync position:", err));
        }
      }
    });
  }, [updateComponent]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onDragOver = useCallback((evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    async (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      setIsDragOver(false);
      
      console.log("🔥 DROP EVENT FIRED on page:", pageId);

      const type = evt.dataTransfer.getData("application/reactflow") || evt.dataTransfer.getData("text/plain");
      console.log("📦 DataTransfer type:", type);
      
      if (!type || !nodeTypes[type]) {
        console.warn("⚠️ No valid type found in DataTransfer:", type);
        return;
      }

      // Calculer la position par rapport au container du flux
      const position = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      console.log("📍 Position calculée:", position);

      // Mapping types...
      let backendType = 'texte';
      let uiType = 'text';
      let label = 'Paragraphe';
      
      if (type === 'buttonNode') { backendType = 'bouton'; uiType = 'button'; label = 'Bouton'; }
      if (type === 'inputNode') { backendType = 'champ_input'; uiType = 'input'; label = 'Saisissez ici...'; }
      if (type === 'imageNode') { backendType = 'image'; uiType = 'image'; label = 'Image'; }
      if (type === 'containerNode') { backendType = 'conteneur'; uiType = 'container'; label = 'Conteneur'; }
      if (type === 'listNode') { backendType = 'liste'; uiType = 'dataList'; label = 'Liste'; }
      if (type === 'headingNode') { backendType = 'texte'; uiType = 'heading'; label = 'Titre Principal'; }
      if (type === 'cardNode') { backendType = 'carte'; uiType = 'card'; label = 'Carte de Contenu'; }
      if (type === 'navNode') { backendType = 'navigation'; uiType = 'nav'; label = 'MON LOGO'; }
      if (type === 'formNode') { backendType = 'formulaire'; uiType = 'form'; label = 'Formulaire de Contact'; }

      // Création optimiste (temporaire avant réponse API)
      const tempId = `temp_${Date.now()}`;
      const optimisticNode = {
        id: tempId,
        type,
        position,
        data: { label: label, isOptimistic: true },
        style: { opacity: 0.5 }
      };
      setNodes((nds) => [...nds, optimisticNode]);

      try {
        const data = await createComponent(pageId, {
          type: backendType,
          position_x: Math.round(position.x),
          position_y: Math.round(position.y),
          config: { 
            uiType: uiType,
            label: label,
            props: { text: label, label: label, placeholder: label }
          },
          ordre: nodesRef.current.length
        });

        const newNode = {
          id: data.tracking_id,
          type,
          position: { x: data.position_x, y: data.position_y },
          data: { 
            label: data.config?.label || type, 
            component: data,
            styles: data.styles || {},
            tables: tables,
          },
          style: {
            width: type === 'inputNode' ? '260px' : (data.largeur || 'auto'),
            height: data.hauteur || 'auto',
            ...(type === 'buttonNode' || type === 'inputNode' || type === 'imageNode' || type === 'containerNode' || type === 'listNode' || type === 'headingNode' || type === 'cardNode' || type === 'navNode' || type === 'formNode' ? {
              backgroundColor: 'transparent', border: 'none', padding: 0,
            } : {
              backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px',
            })
          }
        };

        setNodes((nds) => nds.filter(n => n.id !== tempId).concat(newNode));
        setSelectedNodeId(newNode.id);
        console.log("✅ Composant ajouté, sauvegardé et sélectionné:", newNode.id);
        
        if (refreshInterface) {
          refreshInterface();
        }
      } catch (err) {
        console.error("❌ Erreur création composant:", err);
        setNodes((nds) => nds.filter(n => n.id !== tempId));
        toast.alert(err.userMessage || "Erreur lors de la création du composant sur le serveur.");
      }
    },
    [screenToFlowPosition, pageId, refreshInterface, createComponent, setSelectedNodeId]
  );

  const handleNodeClick = useCallback((evt, node) => {
    evt.stopPropagation();
    console.log("🎯 Nœud sélectionné au clic:", node?.id);
    setSelectedNodeId(node?.id ?? null);
  }, [setSelectedNodeId]);

  return (
    <div
      className={`relative w-full h-full bg-white rounded-md overflow-hidden shadow-inner transition-all ${isDragOver ? 'ring-4 ring-[#C4622D] ring-inset bg-orange-50/20' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {/* Zone de rendu principal : Sections IA (Pass-through pour les clics vers ReactFlow) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', overflowY: 'auto' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SectionRenderer sections={sections} isLoading={isLoadingSections} connectionsMap={{}} />
        </div>
      </div>

      {/* Zone de travail : Drag & Drop */}
      <ReactFlow
        key={pageId}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onSelectionChange={onFlowSelectionChange}
        onNodeClick={handleNodeClick}
        nodesDraggable={true}
        elementsSelectable={true}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        preventScrolling={true}
        minZoom={1}
        maxZoom={1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ zIndex: 10, background: 'transparent', width: '100%', height: '100%' }}
      >
        <Background color="#f1f5f9" gap={25} size={1} variant="dots" />
        <Controls
          style={{ bottom: "10px", left: "10px" }}
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
      </ReactFlow>

      {/* Zone Header / Footer suggestion - visuel seulement */}
      <div className="absolute top-0 left-0 right-0 h-[80px] border-b border-dashed border-blue-50 flex items-center justify-center text-[9px] text-gray-300 font-bold bg-gray-50/30 pointer-events-none z-0 tracking-[0.2em]">
        ZONE HEADER
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[60px] border-t border-dashed border-blue-50 flex items-center justify-center text-[9px] text-gray-300 font-bold bg-gray-50/30 pointer-events-none z-0 tracking-[0.2em]">
        ZONE FOOTER
      </div>
    </div>
  );
}

/**
 * Composant représentant les pages de travail redimensionnables avec ReactFlow intégré
 * Modifié au Sprint 5 pour accepter les props de CanvasContainer et utiliser l'adaptateur
 */
export default function WorkspaceViewport({ page, index, projectId, refreshInterface }) {
  const { currentProjectId } = useProjects();
  const activeProjectId = projectId || currentProjectId;
  const { updateComponent, createComponent, deleteComponent } = useInterface(activeProjectId);

  return (
    <PageViewport
      key={`${page.tracking_id}`}
      page={page}
      index={index}
      projectId={activeProjectId}
      refreshInterface={refreshInterface}
      updateComponent={updateComponent}
      createComponent={createComponent}
      deleteComponent={deleteComponent}
    />
  );
}

/**
 * Composant représentant une page de travail redimensionnable avec ReactFlow intégré
 */
function PageViewport({ page, index, projectId, refreshInterface, updateComponent, createComponent, deleteComponent }) {
  const { tables } = useSchema(projectId);
  const { viewportMode } = useProjects();
  
  // Calculate dynamic width based on viewport mode
  const pageWidth = useMemo(() => {
    switch (viewportMode) {
      case "mobile": return 375;
      case "tablet": return 768;
      case "desktop":
      default: return page?.config?.width || 1200;
    }
  }, [viewportMode, page?.config?.width]);

  const [pageHeight, setPageHeight] = useState(page?.config?.height || 800);
  const [pageX, setPageX] = useState(100 + index * (1200 + 100)); // Keep spacing consistent using default 1200
  const [pageY, setPageY] = useState(100);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSelected, setIsSelected] = useState(false);

  // Initial nodes from backend components
  const initialNodes = useMemo(() => {
    return (page.composants || []).map(comp => {
      // Mapping par défaut basé sur comp.type
      let type = 'textNode';
      
      const typeMap = {
        'texte': 'textNode',
        'bouton': 'buttonNode',
        'champ_input': 'inputNode',
        'input': 'inputNode',
        'image': 'imageNode',
        'conteneur': 'containerNode',
        'liste': 'listNode',
        'carte': 'cardNode',
        'navigation': 'navNode',
        'formulaire': 'formNode'
      };

      if (typeMap[comp.type]) {
        type = typeMap[comp.type];
      }
      
      // Raffinement basé sur uiType si présent
      if (comp.config?.uiType) {
        if (comp.config.uiType === 'heading') type = 'headingNode';
        if (comp.config.uiType === 'card') type = 'cardNode';
        if (comp.config.uiType === 'nav') type = 'navNode';
        if (comp.config.uiType === 'form') type = 'formNode';
        if (comp.config.uiType === 'dataList') type = 'listNode';
      }

      return {
        id: comp.tracking_id,
        type,
        position: { x: comp.position_x || 20, y: comp.position_y || 20 },
        data: { 
          label: comp.config?.label || comp.type,
          component: comp,
          styles: comp.styles || {},
          tables: tables || [],
        },
        style: {
          width: comp.largeur || 'auto',
          height: comp.hauteur || 'auto',
          ...(comp.styles || {}),
          ...(type === 'buttonNode' || type === 'inputNode' || type === 'imageNode' || type === 'containerNode' || type === 'listNode' || type === 'headingNode' || type === 'cardNode' || type === 'navNode' || type === 'formNode' ? {
            backgroundColor: comp.styles?.backgroundColor || 'transparent',
            border: comp.styles?.border || 'none',
            padding: comp.styles?.padding || 0,
          } : {
            backgroundColor: comp.styles?.backgroundColor || '#ffffff',
            border: comp.styles?.border || '1px solid #d1d5db',
            borderRadius: comp.styles?.borderRadius || '4px',
            padding: comp.styles?.padding || '8px',
          })
        }
      };
    });
  }, [page.composants, tables]);

  const resizeTimeoutRef = useRef(null);

  const startResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setIsSelected(true);
    setDragStart({ y: e.clientY, startHeight: pageHeight });
  }, [pageHeight]);

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const deltaY = e.clientY - dragStart.y;
      const newHeight = Math.max(300, dragStart.startHeight + deltaY);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => setPageHeight(newHeight), 16);
    } else if (isDragging) {
      setPageX(e.clientX - dragStart.x);
      setPageY(e.clientY - dragStart.y);
    }
  }, [isResizing, isDragging, dragStart]);

  const stopInteraction = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isResizing || isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopInteraction);
      document.body.style.cursor = isResizing ? "ns-resize" : "grabbing";
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopInteraction);
        document.body.style.cursor = "default";
      };
    }
  }, [isResizing, isDragging, handleMouseMove, stopInteraction]);

  const handlePersistNodeUpdate = useCallback(async (nodeId, updates) => {
    try {
      await updateComponent(nodeId, updates);
      console.log(`✅ Persistance réussie pour ${nodeId}`);
    } catch (err) {
      console.error(`❌ Échec persistance pour ${nodeId}:`, err);
    }
  }, [updateComponent]);

  const handlePersistNodeDelete = useCallback(async (nodeId) => {
    try {
      await deleteComponent(nodeId);
      console.log(`✅ Persistance suppression réussie pour ${nodeId}`);
    } catch (err) {
      console.error(`❌ Échec persistance suppression pour ${nodeId}:`, err);
    }
  }, [deleteComponent]);

  return (
    <div
      id={`workspace-page-${page.tracking_id}`}
      onClick={() => setIsSelected(true)}
      style={{
        position: "absolute",
        top: `${pageY}px`,
        left: `${pageX}px`,
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        border: isSelected ? "3px solid #C4622D" : "2px solid #E8D9C4",
        borderRadius: "12px",
        boxShadow: isSelected
          ? "0 20px 50px -12px rgba(196, 98, 45, 0.25)"
          : "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        zIndex: isSelected ? 20 : 1,
        transition: isResizing || isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}
    >
      <div
        id={`page-title-${page.tracking_id}`}
        // onMouseDown={startDrag}
        className={`absolute top-0 left-0 px-5 py-2 text-[11px] font-bold tracking-wider uppercase flex items-center gap-2 cursor-grab active:cursor-grabbing z-[30] transition-colors ${isSelected ? 'bg-[#C4622D] text-white' : 'bg-[#1A0E0A] text-white/70'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-white/30'}`}></div>
        {page.nom || `Page ${index + 1}`}
      </div>

      <ReactFlowProvider>
        <ReactFlowSelectionProvider onPersistNodeUpdate={handlePersistNodeUpdate} onPersistNodeDelete={handlePersistNodeDelete}>
          <div style={{ width: "100%", height: "100%" }}>
            <CanvasPage
              initialNodes={initialNodes}
              initialSections={page.sections || []}
              pageId={page.tracking_id}
              isSelected={isSelected}
              refreshInterface={refreshInterface}
              updateComponent={updateComponent}
              createComponent={createComponent}
              tables={tables || []}
            />
          </div>
        </ReactFlowSelectionProvider>
      </ReactFlowProvider>

      <div
        onMouseDown={startResize}
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-2 rounded-t-full cursor-ns-resize z-[30] transition-all ${isSelected ? 'bg-[#C4622D] hover:h-3' : 'bg-gray-200'}`}
      ></div>
    </div>
  );
}

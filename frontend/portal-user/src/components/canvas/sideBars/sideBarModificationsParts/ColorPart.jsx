// src/components/canvas/sideBars/sideBarModificationsParts/ColorPart.jsx
import React, { useState, useEffect } from "react";
import { useNodeBackgroundColor, useNodeBorderColor, useNodeTextColor } from "../../../../selection";
import { useSelectedNode, getNodeAppearance } from "../../../../selection";
import { Palette, Pipette } from "lucide-react";

/**
 * Composant ColorPart - Gestion complète des couleurs (background, bordure, texte)
 */
export default function ColorPart() {
  const [activeTab, setActiveTab] = useState('background');

  // Hooks pour les différents types de couleurs
  const backgroundHook = useNodeBackgroundColor();
  const borderHook = useNodeBorderColor();
  const textHook = useNodeTextColor();

  // Sélection actuelle pour connaître le nœud et ses propriétés
  const { selectedNodeId, getSelectedNode } = useSelectedNode();
  const [previewBorderRadius, setPreviewBorderRadius] = useState(0);

  // Initialiser / synchroniser l'arrondi de l'aperçu selon le nœud sélectionné
  useEffect(() => {
    try {
      const node = getSelectedNode?.();
      if (node) {
        const appearance = getNodeAppearance(node);
        if (appearance) {
          setPreviewBorderRadius(appearance.borderRadius || 0);
        }
      } else {
        setPreviewBorderRadius(0);
      }
    } catch (_e) {
      setPreviewBorderRadius(0);
    }
  }, [selectedNodeId, getSelectedNode]);

  // Écoute les changements d'arrondi provenant d'AppearancePart pour MAJ immédiate
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      if (detail.nodeId && selectedNodeId && detail.nodeId === selectedNodeId) {
        setPreviewBorderRadius(detail.value || 0);
      }
    };
    window.addEventListener('ui:colorPreviewBorderRadius', handler);
    return () => window.removeEventListener('ui:colorPreviewBorderRadius', handler);
  }, [selectedNodeId]);

  // Détermine quel hook utiliser selon l'onglet actif
  const getCurrentHook = () => {
    switch (activeTab) {
      case 'background': return backgroundHook;
      case 'border': return borderHook;
      case 'text': return textHook;
      default: return backgroundHook;
    }
  };

  const currentHook = getCurrentHook();

  if (!currentHook.hasSelectedNode) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-2">
          <Palette className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Couleurs</h3>
        </div>
        <p className="text-xs text-gray-500">
          Sélectionnez un élément pour modifier ses couleurs.
        </p>
      </div>
    );
  }

  // Couleurs prédéfinies populaires
  const presetColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#000000', '#ffffff', '#6b7280', '#dc2626', '#059669'
  ];

  // Gestionnaire pour les couleurs prédéfinies
  const handlePresetColor = (color) => {
    currentHook.handleColorPicker(color);
  };

  // Fonction pour obtenir le label de l'onglet
  const getTabLabel = (tab) => {
    switch (tab) {
      case 'background': return 'Fond';
      case 'border': return 'Bordure';
      case 'text': return 'Texte';
      default: return tab;
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center mb-3">
        <Palette className="w-4 h-4 text-blue-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-800">Couleurs</h3>
      </div>

      {/* Onglets pour les différents types de couleurs */}
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        {['background', 'border', 'text'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Aperçu de la couleur actuelle */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Couleur actuelle
        </label>
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-8 border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: currentHook.currentColor, borderRadius: `${previewBorderRadius}px` }}
            title={currentHook.currentColor}
          />
          <div className="flex-1">
            <input
              type="color"
              value={currentHook.currentColor}
              onChange={(e) => currentHook.handleColorPicker(e.target.value)}
              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
              title="Sélecteur de couleur"
            />
          </div>
        </div>
      </div>

      {/* Input hexadécimal */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Code hexadécimal
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">#</span>
          <input
            type="text"
            value={currentHook.inputValue}
            onChange={(e) => currentHook.handleInputChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
            placeholder="FFFFFF"
            maxLength={6}
          />
        </div>
      </div>

      {/* Couleurs prédéfinies */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Couleurs populaires
        </label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => handlePresetColor(color)}
              className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                currentHook.currentColor === color 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Instructions selon le type */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <div className="flex items-center mb-1">
          <Pipette className="w-3 h-3 mr-1" />
          <span className="font-medium">Astuce :</span>
        </div>
        {activeTab === 'background' && "Cette couleur modifie l'arrière-plan de l'élément."}
        {activeTab === 'border' && "Cette couleur modifie la bordure de l'élément."}
        {activeTab === 'text' && "Cette couleur modifie la couleur du texte."}
      </div>
    </div>
  );
}

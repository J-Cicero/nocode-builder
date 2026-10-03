// src/components/canvas/sideBars/sideBarModificationsParts/LayoutPart.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelectedNode, getNodeLayout } from "../../../../selection";
import { Layout, Maximize2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

/**
 * Composant LayoutPart - Gestion de la mise en page et des dimensions
 */
export default function LayoutPart() {
  const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
  const [dimensions, setDimensions] = useState({ width: '', height: '' });
  const [alignment, setAlignment] = useState('left');

  // Utiliser une ref pour getSelectedNode
  const getSelectedNodeRef = React.useRef(getSelectedNode);
  React.useEffect(() => {
    getSelectedNodeRef.current = getSelectedNode;
  }, [getSelectedNode]);

  // TOUS LES HOOKS DOIVENT ÊTRE DÉFINIS AVANT TOUT RETURN CONDITIONNEL

  // Gestionnaire pour les dimensions
  const handleDimensionChange = useCallback((dimension, value) => {
    setDimensions(prev => ({ ...prev, [dimension]: value }));

    // Applique immédiatement si c'est un nombre valide
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSelectedNodeStyle({
        [dimension]: `${numValue}px`
      });
    } else if (value === '') {
      // Supprime la dimension si vide
      updateSelectedNodeStyle({
        [dimension]: 'auto'
      });
    }
  }, [updateSelectedNodeStyle]);

  // Gestionnaire pour l'alignement du texte
  const handleAlignmentChange = useCallback((newAlignment) => {
    setAlignment(newAlignment);
    updateSelectedNodeStyle({
      textAlign: newAlignment
    });
  }, [updateSelectedNodeStyle]);

  // Gestionnaire pour les dimensions prédéfinies
  const applyPresetSize = useCallback((preset) => {
    let newDimensions = {};

    switch (preset) {
      case 'auto':
        newDimensions = { width: 'auto', height: 'auto' };
        setDimensions({ width: '', height: '' });
        break;
      case 'fullWidth':
        newDimensions = { width: '100%' };
        setDimensions(prev => ({ ...prev, width: '100' }));
        break;
      case 'button':
        newDimensions = { width: '120px', height: '40px' };
        setDimensions({ width: '120', height: '40' });
        break;
      case 'card':
        newDimensions = { width: '300px', height: '200px' };
        setDimensions({ width: '300', height: '200' });
        break;
      default:
        return;
    }

    updateSelectedNodeStyle(newDimensions);
  }, [updateSelectedNodeStyle]);

  // Récupère les dimensions actuelles du nœud en utilisant getPropriete.js
  useEffect(() => {
    if (selectedNodeId) {
      const node = getSelectedNodeRef.current();
      if (node) {
        // Utiliser getNodeLayout pour récupérer les propriétés
        const layoutProps = getNodeLayout(node);

        if (layoutProps) {
          setDimensions({
            width: layoutProps.widthNumeric > 0 ? layoutProps.widthNumeric.toString() : '',
            height: layoutProps.heightNumeric > 0 ? layoutProps.heightNumeric.toString() : ''
          });
          setAlignment(layoutProps.textAlign || 'left');
        }
      }
    } else {
      setDimensions({ width: '', height: '' });
      setAlignment('left');
    }
  }, [selectedNodeId]); // Retirer getSelectedNode

  // MAINTENANT ON PEUT FAIRE LE RETURN CONDITIONNEL
  if (!selectedNodeId) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-2">
          <Layout className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Mise en page</h3>
        </div>
        <p className="text-xs text-gray-500">
          Sélectionnez un élément pour modifier sa mise en page.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center mb-3">
        <Layout className="w-4 h-4 text-blue-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-800">Mise en page</h3>
      </div>

      {/* Dimensions */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Dimensions (px)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Largeur</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hauteur</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Tailles prédéfinies */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Tailles prédéfinies
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPresetSize('auto')}
            className="flex items-center justify-center px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Auto
          </button>
          <button
            onClick={() => applyPresetSize('fullWidth')}
            className="flex items-center justify-center px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Largeur 100%
          </button>
          <button
            onClick={() => applyPresetSize('button')}
            className="flex items-center justify-center px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            Bouton (120×40)
          </button>
          <button
            onClick={() => applyPresetSize('card')}
            className="flex items-center justify-center px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            Carte (300×200)
          </button>
        </div>
      </div>

      {/* Alignement du texte */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Alignement du texte
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleAlignmentChange('left')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
              alignment === 'left'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Aligner à gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignmentChange('center')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
              alignment === 'center'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Centrer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignmentChange('right')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
              alignment === 'right'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Aligner à droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Espacement */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Espacement rapide
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateSelectedNodeStyle({ padding: '8px' })}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Padding 8px
          </button>
          <button
            onClick={() => updateSelectedNodeStyle({ padding: '16px' })}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Padding 16px
          </button>
          <button
            onClick={() => updateSelectedNodeStyle({ margin: '8px' })}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Margin 8px
          </button>
          <button
            onClick={() => updateSelectedNodeStyle({ margin: '16px' })}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Margin 16px
          </button>
        </div>
      </div>
    </div>
  );
}

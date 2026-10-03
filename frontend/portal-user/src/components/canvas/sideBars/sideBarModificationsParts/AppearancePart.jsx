// src/components/canvas/sideBars/sideBarModificationsParts/AppearancePart.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelectedNode, getNodeAppearance } from "../../../../selection";
import { Sparkles, Eye, Square } from "lucide-react";

/**
 * Composant AppearancePart - Gestion des effets visuels et de l'apparence
 */
export default function AppearancePart() {
  const { selectedNodeId, getSelectedNode, updateSelectedNodeStyle } = useSelectedNode();
  const [opacity, setOpacity] = useState(100);
  const [borderRadius, setBorderRadius] = useState(0);
  const [borderWidth, setBorderWidth] = useState(0);
  const [shadowIntensity, setShadowIntensity] = useState(0);

  // Utiliser une ref pour getSelectedNode
  const getSelectedNodeRef = React.useRef(getSelectedNode);
  React.useEffect(() => {
    getSelectedNodeRef.current = getSelectedNode;
  }, [getSelectedNode]);

  // TOUS LES HOOKS DOIVENT ÊTRE DÉFINIS AVANT TOUT RETURN CONDITIONNEL

  // Gestionnaire pour l'opacité
  const handleOpacityChange = useCallback((value) => {
    setOpacity(value);
    updateSelectedNodeStyle({
      opacity: value / 100
    });
  }, [updateSelectedNodeStyle]);

  // Gestionnaire pour le border radius
  const handleBorderRadiusChange = useCallback((value) => {
    setBorderRadius(value);

    // Déterminer le type de nœud pour cibler le bon élément
    const node = getSelectedNodeRef.current?.();
    const isButton = node?.type === 'buttonNode';

    if (isButton) {
      // Pour les boutons: appliquer via la variable CSS consommée par <button>
      updateSelectedNodeStyle({
        '--button-border-radius': `${value}px`
      });
    } else {
      // Pour les autres nœuds: appliquer sur le conteneur du nœud
      updateSelectedNodeStyle({
        borderRadius: `${value}px`
      });
    }

    // Notifier l'aperçu de couleur pour synchroniser son arrondi
    try {
      window.dispatchEvent(new CustomEvent('ui:colorPreviewBorderRadius', {
        detail: { nodeId: selectedNodeId, value }
      }));
    } catch (e) {
      // no-op
    }
  }, [updateSelectedNodeStyle, selectedNodeId]);

  // Gestionnaire pour la largeur de bordure
  const handleBorderWidthChange = useCallback((value) => {
    setBorderWidth(value);

    // Déterminer le type de nœud pour cibler le bon élément
    const node = getSelectedNodeRef.current?.();
    const isButton = node?.type === 'buttonNode';

    if (isButton) {
      // Pour les boutons: appliquer via la variable CSS utilisée par <button>
      updateSelectedNodeStyle({
        '--button-border-width': `${value}px`,
      });
    } else {
      // Pour les autres nœuds: appliquer sur le conteneur
      updateSelectedNodeStyle({
        borderWidth: `${value}px`,
        borderStyle: value > 0 ? 'solid' : 'none',
        borderColor: value > 0 ? '#d1d5db' : 'transparent'
      });
    }
  }, [updateSelectedNodeStyle]);

  // Gestionnaire pour les ombres
  const handleShadowChange = useCallback((intensity) => {
    setShadowIntensity(intensity);

    let boxShadow = 'none';
    if (intensity > 0) {
      const shadows = {
        1: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        2: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        3: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        4: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        5: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      };
      boxShadow = shadows[intensity] || shadows[3];
    }

    updateSelectedNodeStyle({
      boxShadow
    });
  }, [updateSelectedNodeStyle]);

  // Effets prédéfinis
  const applyPresetEffect = useCallback((effectType) => {
    switch (effectType) {
      case 'card':
        handleBorderRadiusChange(8);
        handleShadowChange(2);
        break;
      case 'button':
        handleBorderRadiusChange(6);
        handleShadowChange(1);
        break;
      case 'modal':
        handleBorderRadiusChange(12);
        handleShadowChange(4);
        break;
      case 'flat':
        handleBorderRadiusChange(0);
        handleShadowChange(0);
        handleBorderWidthChange(1);
        break;
      case 'pill':
        handleBorderRadiusChange(50);
        handleShadowChange(1);
        break;
      case 'glass':
        handleOpacityChange(80);
        handleBorderRadiusChange(12);
        handleShadowChange(3);
        break;
      default:
        break;
    }
  }, [handleBorderRadiusChange, handleShadowChange, handleBorderWidthChange, handleOpacityChange]);

  // Récupère les valeurs actuelles du nœud en utilisant getPropriete.js
  useEffect(() => {
    if (selectedNodeId) {
      const node = getSelectedNodeRef.current();
      if (node) {
        // Utiliser getNodeAppearance pour récupérer les propriétés
        const appearanceProps = getNodeAppearance(node);

        if (appearanceProps) {
          setOpacity(appearanceProps.opacity || 100);
          setBorderRadius(appearanceProps.borderRadius || 0);
          setBorderWidth(appearanceProps.borderWidth || 0);
          setShadowIntensity(appearanceProps.shadowIntensity || 0);
        }
      }
    } else {
      setOpacity(100);
      setBorderRadius(0);
      setBorderWidth(0);
      setShadowIntensity(0);
    }
  }, [selectedNodeId]); // Retirer getSelectedNode

  // MAINTENANT ON PEUT FAIRE LE RETURN CONDITIONNEL
  if (!selectedNodeId) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-2">
          <Sparkles className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Apparence</h3>
        </div>
        <p className="text-xs text-gray-500">
          Sélectionnez un élément pour modifier son apparence.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center mb-3">
        <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-800">Apparence</h3>
      </div>

      {/* Opacité */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          <Eye className="w-3 h-3 inline mr-1" />
          Opacité ({opacity}%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Arrondi des coins */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          <Square className="w-3 h-3 inline mr-1" />
          Arrondi des coins ({borderRadius}px)
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={borderRadius}
          onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Largeur de bordure */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Bordure ({borderWidth}px)
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={borderWidth}
          onChange={(e) => handleBorderWidthChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Intensité de l'ombre */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Ombre (Niveau {shadowIntensity})
        </label>
        <input
          type="range"
          min="0"
          max="5"
          value={shadowIntensity}
          onChange={(e) => handleShadowChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Effets prédéfinis */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Styles prédéfinis
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPresetEffect('card')}
            className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            Carte
          </button>
          <button
            onClick={() => applyPresetEffect('button')}
            className="px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
          >
            Bouton
          </button>
          <button
            onClick={() => applyPresetEffect('modal')}
            className="px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
          >
            Modal
          </button>
          <button
            onClick={() => applyPresetEffect('flat')}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Plat
          </button>
          <button
            onClick={() => applyPresetEffect('pill')}
            className="px-3 py-2 text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-md transition-colors"
          >
            Pilule
          </button>
          <button
            onClick={() => applyPresetEffect('glass')}
            className="px-3 py-2 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
          >
            Verre
          </button>
        </div>
      </div>

      {/* Réinitialisation */}
      <button
        onClick={() => {
          handleOpacityChange(100);
          handleBorderRadiusChange(0);
          handleBorderWidthChange(0);
          handleShadowChange(0);
        }}
        className="w-full px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
      >
        Réinitialiser l'apparence
      </button>
    </div>
  );
}

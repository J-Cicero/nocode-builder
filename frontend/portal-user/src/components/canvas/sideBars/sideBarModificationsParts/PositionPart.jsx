// src/components/canvas/sideBars/sideBarModificationsParts/PositionPart.jsx
import React, { useEffect, useState } from "react";
import { useNodePosition, useNodeRotation, useSelectedNode, getNodePosition } from "../../../../selection";
import { Move, RotateCw, FlipHorizontal, FlipVertical, RotateCcw } from "lucide-react";

/**
 * Composant PositionPart - Gestion de la position et rotation des nœuds
 * Maintenant utilise getPropriete.js pour se mettre à jour automatiquement
 */
export default function PositionPart() {
  const { selectedNodeId, getSelectedNode } = useSelectedNode();
  const { position, setPosition, hasSelectedNode: hasNodePosition } = useNodePosition();
  const {
    rotation,
    setRotation,
    addRotation,
    flipHorizontal,
    flipVertical,
    resetRotation,
    hasSelectedNode: hasNodeRotation
  } = useNodeRotation();

  // État local pour affichage immédiat
  const [displayPosition, setDisplayPosition] = useState({ x: 0, y: 0 });
  const [displayRotation, setDisplayRotation] = useState(0);

  // Utiliser une ref pour getSelectedNode
  const getSelectedNodeRef = React.useRef(getSelectedNode);
  React.useEffect(() => {
    getSelectedNodeRef.current = getSelectedNode;
  }, [getSelectedNode]);

  // Synchroniser avec les propriétés du nœud à chaque changement de sélection
  useEffect(() => {
    if (selectedNodeId) {
      const node = getSelectedNodeRef.current();
      if (node) {
        const positionProps = getNodePosition(node);
        if (positionProps) {
          setDisplayPosition({ x: positionProps.x, y: positionProps.y });
          setDisplayRotation(positionProps.rotation);
        }
      }
    }
  }, [selectedNodeId]); // Retirer getSelectedNode, position et rotation

  // Synchroniser displayPosition avec position du hook
  useEffect(() => {
    setDisplayPosition(position);
  }, [position]);

  // Synchroniser displayRotation avec rotation du hook
  useEffect(() => {
    setDisplayRotation(rotation);
  }, [rotation]);

  if (!hasNodePosition) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-2">
          <Move className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Position & Rotation</h3>
        </div>
        <p className="text-xs text-gray-500">
          Sélectionnez un élément pour modifier sa position.
        </p>
      </div>
    );
  }

  // Gestionnaires pour la position
  const handlePositionChange = (axis, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setPosition({ [axis]: numValue });
      setDisplayPosition(prev => ({ ...prev, [axis]: numValue }));
    }
  };

  // Gestionnaire pour la rotation
  const handleRotationChange = (value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setRotation(numValue);
      setDisplayRotation(numValue);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center mb-3">
        <Move className="w-4 h-4 text-blue-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-800">Position & Rotation</h3>
      </div>

      {/* Position */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Position
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(displayPosition.x)}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(displayPosition.y)}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      {hasNodeRotation && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Rotation ({Math.round(displayRotation)}°)
          </label>

          {/* Input de rotation */}
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={Math.round(displayRotation)}
                onChange={(e) => handleRotationChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="-360"
                max="360"
              />
              <span className="text-xs text-gray-500">degrés</span>
            </div>
          </div>

          {/* Slider pour rotation */}
          <input
            type="range"
            min="-180"
            max="180"
            value={displayRotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mb-3"
          />

          {/* Boutons de rotation rapide */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => addRotation(-45)}
              className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Rotation -45°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => addRotation(45)}
              className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Rotation +45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={flipHorizontal}
              className="flex items-center justify-center p-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
              title="Retourner horizontalement"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={flipVertical}
              className="flex items-center justify-center p-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
              title="Retourner verticalement"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Réinitialiser la rotation */}
          <button
            onClick={resetRotation}
            className="w-full mt-2 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Réinitialiser la rotation
          </button>
        </div>
      )}

      {/* Positions prédéfinies */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Positionnement rapide
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPosition({ x: 0, y: 0 })}
            className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Origine
          </button>
          <button
            onClick={() => setPosition({ x: 100, y: 100 })}
            className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            (100, 100)
          </button>
          <button
            onClick={() => setPosition({ x: 200, y: 200 })}
            className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            (200, 200)
          </button>
        </div>
      </div>
    </div>
  );
}

// src/components/editor/ResizeHandle.jsx
import React, { useState, useCallback } from "react";

/**
 * Composant de redimensionnement pour ajuster la hauteur du canvas
 * Permet à l'utilisateur de redimensionner verticalement l'espace canvas
 */
export default function ResizeHandle({ onResize }) {
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Démarre le processus de redimensionnement
   */
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  /**
   * Gère le mouvement de la souris pendant le redimensionnement
   */
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      onResize(e.clientY);
    }
  }, [isDragging, onResize]);

  /**
   * Termine le processus de redimensionnement
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Gestion des événements globaux de la souris
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        height: "8px",
        backgroundColor: isDragging ? "#3b82f6" : "#e2e8f0",
        cursor: "ns-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: isDragging ? "none" : "background-color 0.2s",
        borderTop: "1px solid #d1d5db",
        borderBottom: "1px solid #d1d5db",
      }}
    >
      {/* Indicateur visuel de redimensionnement */}
      <div
        style={{
          width: "40px",
          height: "3px",
          backgroundColor: isDragging ? "#1d4ed8" : "#9ca3af",
          borderRadius: "2px",
          transition: isDragging ? "none" : "background-color 0.2s",
        }}
      />
    </div>
  );
}

// src/components/canvas/sideBars/sideBarModificationsParts/InformationPart.jsx
import React, { useState } from "react";
import { useSelectedNode, getNodeData } from "../../../../selection";
import { Trash2, Info, AlertTriangle, X } from "lucide-react";

// Modale de confirmation personnalisée
function ConfirmDeleteModal({ onConfirm, onCancel, componentName }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        style={{ border: "1px solid #fecaca" }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Supprimer l'élément</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <p className="text-sm text-gray-600 mb-1">
          Vous êtes sur le point de supprimer ce composant :
        </p>
        <p className="text-sm font-semibold text-gray-800 mb-4 bg-gray-50 px-3 py-2 rounded-lg border">
          « {componentName || "Composant"} »
        </p>
        <p className="text-xs text-gray-500 mb-5">
          Cette action est <strong>irréversible</strong>. Le composant sera définitivement retiré de la page.
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant InformationPart - Affiche les informations du nœud sélectionné
 * Permet de modifier le nom et de supprimer le nœud avec une modale personnalisée
 */
export default function InformationPart() {
  const { selectedNodeId, getSelectedNode, deleteSelectedNode, updateSelectedNodeData } = useSelectedNode();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fonction pour obtenir le nom lisible du type
  const getTypeLabel = (type) => {
    switch (type) {
      case 'textNode':      return 'Paragraphe';
      case 'buttonNode':    return 'Bouton';
      case 'inputNode':     return 'Champ de saisie';
      case 'imageNode':     return 'Image';
      case 'containerNode': return 'Conteneur';
      case 'listNode':      return 'Liste de données';
      case 'headingNode':   return 'Titre';
      case 'cardNode':      return 'Carte';
      case 'navNode':       return 'Navigation';
      case 'formNode':      return 'Formulaire';
      default: return type || 'Inconnu';
    }
  };

  // Si aucun nœud n'est sélectionné
  if (!selectedNodeId) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-2">
          <Info className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Informations</h3>
        </div>
        <p className="text-xs text-gray-500">
          Aucun élément sélectionné. Cliquez sur un composant pour le modifier.
        </p>
      </div>
    );
  }

  const selectedNode = getSelectedNode();
  const nodeData = getNodeData(selectedNode);
  const nodeType = selectedNode?.type || "inconnu";
  const componentLabel = nodeData?.label || getTypeLabel(nodeType);

  const handleLabelChange = (newLabel) => {
    updateSelectedNodeData({ label: newLabel });
  };

  const handleDeleteRequest = () => {
    setShowConfirmModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowConfirmModal(false);
    deleteSelectedNode();
  };

  const handleDeleteCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Modale de confirmation */}
      {showConfirmModal && (
        <ConfirmDeleteModal
          componentName={componentLabel}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Info className="w-4 h-4 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-800">Informations</h3>
          </div>
          <button
            onClick={handleDeleteRequest}
            className="p-1 hover:bg-red-100 rounded transition-colors group"
            title="Supprimer cet élément"
          >
            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Type du nœud */}
          <div className="bg-white p-2 rounded border border-blue-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</span>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {getTypeLabel(nodeType)}
            </p>
          </div>

          {/* Nom du composant (éditable) */}
          <div className="bg-white p-2 rounded border border-blue-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nom du composant</span>
            <input
              type="text"
              value={nodeData?.label || ''}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="Donnez un nom au composant..."
            />
          </div>

          {/* Contenu si disponible */}
          {nodeData?.content && (
            <div className="bg-white p-2 rounded border border-blue-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contenu</span>
              <p className="text-sm text-gray-700 line-clamp-3 mt-0.5">{nodeData.content}</p>
            </div>
          )}
        </div>

        {/* Bouton de suppression */}
        <button
          onClick={handleDeleteRequest}
          className="w-full mt-3 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer le composant
        </button>
      </div>
    </>
  );
}

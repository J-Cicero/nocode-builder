import React from 'react';
import { useSelectedNode } from '../../../../selection';

export default function EffectPart() {
  const { selectedNodeId } = useSelectedNode();

  if (!selectedNodeId) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-800 mb-3">Effets</h3>
      <p className="text-xs text-gray-500">
        Fonctionnalité d'effets (ombres, flous) bientôt disponible.
      </p>
    </div>
  );
}

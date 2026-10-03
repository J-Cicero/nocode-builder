import React from "react";
import { Handle, Position } from "@xyflow/react";

export function ImageNode({ id, data }) {
  // Optionnel: ajouter un mode édition pour l'URL de l'image
  return (
    <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 relative overflow-hidden group">
      {data?.url ? (
        <img src={data.url} alt={data?.alt || "Image"} className="w-full h-full object-cover" />
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      )}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

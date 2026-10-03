import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Plus } from 'lucide-react';

const TableNode = ({ data, selected }) => {
  return (
    <div className={`min-w-[200px] bg-white rounded-lg shadow-lg border-2 transition-all ${selected ? 'border-[#C4622D] shadow-xl' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="bg-[#1A0E0A] text-white p-3 rounded-t-[6px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-[#D4A017]" />
          <span className="font-bold text-sm">{data.label}</span>
        </div>
        <button className="hover:bg-white/20 p-1 rounded transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="p-2 space-y-1">
        {data.fields && data.fields.length > 0 ? (
          data.fields.map((field) => (
            <div key={field.tracking_id} className="flex items-center justify-between text-xs p-1.5 hover:bg-gray-50 rounded group">
              <span className="text-gray-700 font-medium">{field.display_name || field.name}</span>
              <span className="text-gray-400 group-hover:text-gray-500 italic">{field.type}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-gray-400 italic p-2 text-center">Aucune info</div>
        )}
      </div>

      {/* Handles for relations */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-[#C4622D]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white bg-[#C4622D]"
      />
    </div>
  );
};

export default memo(TableNode);

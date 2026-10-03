import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";
import { getComputedStyle, getBindingInfo, BindingBadge } from "../../utils/styleHelper";

export function CardNode(props) {
  const { id, data, style: nodeStyle } = props;
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data?.label ?? "Titre de la Carte");
  const [desc, setDesc] = useState(data?.props?.desc ?? "Une courte description attrayante pour ce contenu.");

  const computedStyle = getComputedStyle('cardNode', nodeStyle, data?.styles, {
    color: '#1A0E0A',
    backgroundColor: '#ffffff',
    borderColor: '#E8D9C4',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    width: '256px',
    height: 'auto',
    textAlign: 'left',
    padding: '20px',
    margin: '0',
  });

  const binding = getBindingInfo(data);
  const displayTitle = binding.isBound ? binding.displayText : (data?.label ?? "Titre de la Carte");

  const commit = useCallback(
    async (newTitle, newDesc) => {
      try {
        await updateComponent(id, {
          config: {
            ...data,
            label: newTitle,
            props: { ...data?.props, text: newTitle, desc: newDesc },
          },
        });
      } catch (err) {
        console.error("Erreur save card:", err);
      }
    },
    [data, id]
  );

  const onDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  return (
    <div 
      className="flex flex-col gap-3 group relative transition-colors"
      style={computedStyle}
      onDoubleClick={onDoubleClick}
    >
      <BindingBadge data={data} />
      {editing ? (
        <div className="flex flex-col gap-2">
           <input
             className="nodrag font-bold text-lg text-[#1A0E0A] border-b border-gray-300 outline-none w-full"
             value={title}
             onChange={e => setTitle(e.target.value)}
           />
           <textarea
             className="nodrag text-sm text-[#7A5C44] border-b border-gray-300 outline-none w-full resize-y"
             value={desc}
             onChange={e => setDesc(e.target.value)}
             rows={3}
           />
           <button 
             className="bg-[#C4622D] text-white text-xs py-1 rounded mt-2"
             onClick={(e) => { e.stopPropagation(); setEditing(false); commit(title, desc); }}
           >
             OK
           </button>
        </div>
      ) : (
        <>
          <div className="w-full h-32 bg-[#FBF4E9] rounded-xl flex items-center justify-center text-[#C4622D] mb-2 pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3 className="font-bold text-lg text-[#1A0E0A] leading-tight cursor-text">{displayTitle}</h3>
          <p className="text-sm text-[#7A5C44] leading-relaxed cursor-text">{data?.props?.desc || "Une courte description attrayante pour ce contenu."}</p>
        </>
      )}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

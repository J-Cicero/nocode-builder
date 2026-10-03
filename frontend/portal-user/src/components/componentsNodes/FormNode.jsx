import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";

export function FormNode({ id, data }) {
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data?.label ?? "Formulaire de Contact");
  
  const commit = useCallback(
    async (newTitle) => {
      try {
        await updateComponent(id, {
          config: {
            ...data,
            label: newTitle,
            props: { ...data?.props, text: newTitle },
          },
        });
      } catch (err) {
        console.error("Erreur save form:", err);
      }
    },
    [data, id]
  );

  return (
    <div 
      className="w-[350px] bg-white rounded-2xl shadow-xl border border-[#E8D9C4] p-6 hover:border-[#C4622D] transition-all relative group"
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
    >
      <div className="mb-6 border-b border-gray-100 pb-4">
        {editing ? (
           <input
             autoFocus
             className="nodrag text-xl font-serif font-bold text-[#1A0E0A] outline-none border-b border-gray-300 w-full"
             value={title}
             onChange={e => setTitle(e.target.value)}
             onBlur={() => { setEditing(false); commit(title); }}
             onKeyDown={e => { if (e.key === "Enter") { setEditing(false); commit(title); } }}
           />
        ) : (
          <h2 className="text-xl font-serif font-bold text-[#1A0E0A] cursor-text">
            {data?.label || "Formulaire de Contact"}
          </h2>
        )}
        <p className="text-sm text-[#7A5C44] mt-1 pointer-events-none">Veuillez remplir les champs ci-dessous.</p>
      </div>

      <div className="space-y-4 pointer-events-none">
        <div>
          <label className="block text-xs font-bold text-[#7A5C44] uppercase mb-1">Nom complet</label>
          <div className="h-10 border border-gray-200 rounded-lg bg-gray-50"></div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#7A5C44] uppercase mb-1">Adresse Email</label>
          <div className="h-10 border border-gray-200 rounded-lg bg-gray-50"></div>
        </div>
        
        <button className="w-full h-11 bg-[#1A0E0A] text-white rounded-lg font-bold mt-2">
          Envoyer
        </button>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

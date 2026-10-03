import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";

export function NavNode({ id, data }) {
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const [editing, setEditing] = useState(false);
  const [logo, setLogo] = useState(data?.label ?? "MON LOGO");

  const commit = useCallback(
    async (newLogo) => {
      try {
        await updateComponent(id, {
          config: {
            ...data,
            label: newLogo,
            props: { ...data?.props, text: newLogo },
          },
        });
      } catch (err) {
        console.error("Erreur save nav:", err);
      }
    },
    [data, id]
  );

  return (
    <div className="w-full min-w-[600px] h-16 bg-white border-b border-[#E8D9C4] flex items-center justify-between px-8 shadow-sm">
      <div 
        className="font-black font-serif text-xl text-[#1A0E0A] tracking-wider cursor-text"
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      >
        {editing ? (
          <input
            className="nodrag bg-transparent border-b border-gray-300 outline-none w-32"
            autoFocus
            value={logo}
            onChange={e => setLogo(e.target.value)}
            onBlur={() => { setEditing(false); commit(logo); }}
            onKeyDown={e => { if (e.key === "Enter") { setEditing(false); commit(logo); } }}
          />
        ) : (
          data?.label || "MON LOGO"
        )}
      </div>
      <div className="flex gap-6 text-sm font-bold text-[#7A5C44] pointer-events-none">
         <span>Accueil</span>
         <span>Services</span>
         <span>Contact</span>
         <span className="text-[#C4622D]">Connexion</span>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

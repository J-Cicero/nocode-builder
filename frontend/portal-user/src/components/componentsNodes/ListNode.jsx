import React, { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";

export function ListNode({ id, data }) {
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "Liste de Données");

  const commit = useCallback(
    async (newLabel) => {
      const safe = (newLabel || "").trim() || "Liste de Données";
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: safe } } : n
        )
      );
      try {
        const config = data?.component?.config || {};
        const props = config.props || {};
        await updateComponent(id, {
          config: {
            ...config,
            label: safe,
            props: {
              ...props,
              table: safe
            }
          }
        });
      } catch (err) {
        console.error("Erreur lors de la sauvegarde du composant:", err);
      }
    },
    [id, data, setNodes]
  );

  const onDoubleClick = useCallback(() => setEditing(true), []);
  const onChange = useCallback((e) => setLabel(e.target.value), []);
  
  const onBlur = useCallback(() => {
    commit(label);
    setEditing(false);
  }, [commit, label]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit(label);
        setEditing(false);
      } else if (e.key === "Escape") {
        setLabel(data?.label ?? "Liste de Données");
        setEditing(false);
      }
    },
    [commit, data?.label, label]
  );

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4 relative">
      <div className="w-full">
        <input
          className={`nodrag text-[10px] font-bold text-[#C4622D] mb-3 uppercase w-full bg-transparent border-b border-[#C4622D] outline-none ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={label}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <div
          onDoubleClick={onDoubleClick}
          className={`text-[10px] font-bold text-[#C4622D] mb-3 uppercase cursor-text ${!editing ? '' : 'hidden'}`}
        >
          {data?.label || "Liste de Données"}
        </div>
      </div>
      <div className="space-y-2 pointer-events-none">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-[#FBF4E9] rounded-lg flex items-center px-3 border border-[#E8D9C4]">
             <div className="w-4 h-4 rounded-full bg-[#D4A017]/30 mr-2"></div>
             <div className="h-2 w-24 bg-[#A08060]/20 rounded"></div>
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

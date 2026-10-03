import React, { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";

export function ContainerNode({ id, data }) {
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "Conteneur / Bloc");

  const commit = useCallback(
    async (newLabel) => {
      const safe = (newLabel || "").trim() || "Conteneur / Bloc";
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
              label: safe
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
        setLabel(data?.label ?? "Conteneur / Bloc");
        setEditing(false);
      }
    },
    [commit, data?.label, label]
  );

  return (
    <div className="w-64 h-40 bg-white/50 border-2 border-dashed border-[#E8D9C4] rounded-2xl flex items-center justify-center relative">
      <div className="w-full flex items-center justify-center">
        <input
          className={`nodrag text-[#A08060] font-bold text-xs uppercase tracking-widest text-center bg-transparent border-b border-[#A08060] outline-none ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={label}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <div
          onDoubleClick={onDoubleClick}
          className={`text-[#A08060] font-bold text-xs uppercase tracking-widest cursor-text ${!editing ? '' : 'hidden'}`}
        >
          {data?.label || "Conteneur / Bloc"}
        </div>
      </div>
      {/* Container node often serves as a parent, so handles might be on all sides */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" id="left" />
      <Handle type="source" position={Position.Right} className="opacity-0" id="right" />
    </div>
  );
}

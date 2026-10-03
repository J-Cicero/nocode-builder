import React, { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";

export function InputNode(props) {
  const { id, data, style: nodeStyle } = props;
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "Champ de saisie");

  const computedStyle = {
    backgroundColor: nodeStyle?.backgroundColor || '#ffffff',
    color: nodeStyle?.color || nodeStyle?.textColor || '#000000',
    border: nodeStyle?.border || `${nodeStyle?.borderWidth || '1px'} ${nodeStyle?.borderStyle || 'solid'} ${nodeStyle?.borderColor || '#e5e7eb'}`,
    borderRadius: nodeStyle?.borderRadius || '8px',
    opacity: nodeStyle?.opacity ?? 1,
    boxShadow: nodeStyle?.boxShadow || '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    width: nodeStyle?.width || '260px',
    height: nodeStyle?.height || 'auto',
    textAlign: nodeStyle?.textAlign || 'left',
    padding: nodeStyle?.padding || '12px',
    margin: nodeStyle?.margin || '0',
  };

  const commit = useCallback(
    async (newLabel) => {
      const safe = (newLabel || "").trim() || "Champ de saisie";
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
              label: safe,
              placeholder: safe
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
        setLabel(data?.label ?? "Champ de saisie");
        setEditing(false);
      }
    },
    [commit, data?.label, label]
  );

  return (
    <div className="min-w-[150px]" style={computedStyle}>
      <div className="w-full">
        <input
          className={`nodrag text-[10px] text-gray-400 font-bold mb-1 w-full border-b border-gray-300 outline-none uppercase ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={label}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <div
          onDoubleClick={onDoubleClick}
          className={`text-[10px] text-gray-400 font-bold mb-1 cursor-text uppercase ${!editing ? '' : 'hidden'}`}
        >
          {data?.label || "CHAMP DE SAISIE"}
        </div>
      </div>
      <div className="h-8 border border-gray-100 bg-gray-50 rounded flex items-center px-2 text-gray-300 text-xs italic">
        {data?.placeholder || "Saisissez ici..."}
      </div>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

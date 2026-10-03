import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";
import { getComputedStyle, getBindingInfo, BindingBadge } from "../../utils/styleHelper";

export function HeadingNode(props) {
  const { id, data, style: nodeStyle } = props;
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "Titre Principal");

  const computedStyle = getComputedStyle('headingNode', nodeStyle, data?.styles, {
    color: '#1A0E0A',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderStyle: 'solid',
    borderRadius: '0px',
    opacity: 1,
    boxShadow: 'none',
    width: 'auto',
    height: 'auto',
    textAlign: 'left',
    padding: '8px 16px',
    margin: '0',
  });

  const binding = getBindingInfo(data);
  const displayLabel = binding.isBound ? binding.displayText : (data?.label || "Titre Principal");

  const commit = useCallback(
    async (newLabel) => {
      try {
        await updateComponent(id, {
          config: {
            ...data,
            label: newLabel,
            props: { ...data?.props, text: newLabel },
          },
        });
      } catch (err) {
        console.error("Erreur save heading:", err);
      }
    },
    [data, id]
  );

  const onDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  const onChange = useCallback((e) => {
    setLabel(e.target.value);
  }, []);

  const onBlur = useCallback(() => {
    setEditing(false);
    commit(label);
  }, [commit, label]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit(label);
        setEditing(false);
      } else if (e.key === "Escape") {
        setLabel(data?.label ?? "Titre Principal");
        setEditing(false);
      }
    },
    [commit, data?.label, label]
  );

  return (
    <div className="w-full min-w-[200px] relative" style={computedStyle}>
      <BindingBadge data={data} />
      <div className="w-full">
        <input
          className={`nodrag text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-[#1A0E0A] mb-2 w-full bg-transparent border-b border-gray-300 outline-none ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={label}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <h1
          onDoubleClick={onDoubleClick}
          className={`text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-[#1A0E0A] mb-2 cursor-text ${!editing ? '' : 'hidden'}`}
        >
          {displayLabel}
        </h1>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

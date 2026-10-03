import React, { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";
import { getComputedStyle, getBindingInfo, BindingBadge } from "../../utils/styleHelper";

export default function TextNode(props) {
  const { id, data, style: nodeStyle } = props;
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data?.label ?? "Paragraphe");

  const computedStyle = getComputedStyle('textNode', nodeStyle, data?.styles, {
    color: '#374151',
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
    padding: '8px',
    margin: '0',
  });

  const binding = getBindingInfo(data);
  const displayLabel = binding.isBound ? binding.displayText : (data?.label || "Paragraphe");

  const commit = useCallback(
    async (newLabel) => {
      const safe = (newLabel || "").trim() || "Paragraphe";
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: safe } } : n,
        ),
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
              text: safe,
              label: safe
            }
          }
        });
      } catch (err) {
        console.error("Erreur lors de la sauvegarde du composant:", err);
      }
    },
    [id, data, setNodes],
  );

  const onDoubleClick = useCallback(() => setEditing(true), []);
  const onChange = useCallback((e) => setValue(e.target.value), []);
  const onBlur = useCallback(() => {
    commit(value);
    setEditing(false);
  }, [commit, value]);
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit(value);
        setEditing(false);
      } else if (e.key === "Escape") {
        setValue(data?.label ?? "Paragraphe");
        setEditing(false);
      }
    },
    [commit, data?.label, value],
  );

  return (
    <div className="text-node-container relative" style={computedStyle}>
      <BindingBadge data={data} />
      <div className="w-full">
        <textarea
          className={`nodrag w-full resize-y leading-relaxed ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          rows={Math.max(2, value.split("\n").length)}
        />
        <p
          onDoubleClick={onDoubleClick}
          className={`m-0 cursor-text whitespace-pre-wrap ${!editing ? '' : 'hidden'}`}
        >
          {displayLabel}
        </p>
      </div>
      <Handle type="target" position={Position.Left} className={`opacity-0`} />
      <Handle type="source" position={Position.Right} className={`opacity-0`} />
    </div>
  );
}

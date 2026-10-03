import { useCallback, useState } from "react";
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useProjects } from "../../store/projectStore";
import { useInterface } from "../../hooks/useInterface";
import { getComputedStyle, getBindingInfo, BindingBadge } from "../../utils/styleHelper";

export function ButtonNode(props) {
  const { id, data, style: nodeStyle } = props;
  const { currentProjectId } = useProjects();
  const { updateComponent } = useInterface(currentProjectId);
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data?.label ?? "Bouton");

  // Fusion des styles dynamiques
  const computedStyle = getComputedStyle('buttonNode', nodeStyle, data?.styles, {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderColor: '#3b82f6',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '6px',
    opacity: 1,
    boxShadow: 'none',
    width: 'auto',
    height: 'auto',
    textAlign: 'center',
    padding: '8px 16px',
    margin: '0',
  });

  const binding = getBindingInfo(data);
  const displayLabel = binding.isBound ? binding.displayText : (data?.label ?? "Bouton");

  // Fonction pour valider et sauvegarder les modifications du label
  const commit = useCallback(async (newLabel) => {
    const safe = (newLabel || "").trim() || "Bouton";
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
  }, [id, data, setNodes]);

  // Active le mode édition en double-cliquant
  const onDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  // Met à jour la valeur locale lors de la saisie
  const onInputChange = useCallback((evt) => {
    setValue(evt.target.value);
  }, []);

  // Sauvegarde les changements quand l'input perd le focus
  const onInputBlur = useCallback(() => {
    commit(value.trim() || "Bouton");
    setEditing(false);
  }, [commit, value]);

  // Gère les touches spéciales (Enter pour valider, Escape pour annuler)
  const onInputKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      commit(value.trim() || "Bouton");
      setEditing(false);
    } else if (e.key === "Escape") {
      // Annule l'édition et restaure la valeur depuis data.label
      setValue(data?.label ?? "Bouton");
      setEditing(false);
    }
  }, [commit, data?.label, value]);

  return (
    // Container transparent sans bordure pour éviter la double bordure
    <div className="button-node-container relative">
      <BindingBadge data={data} />
      <div className="w-full flex justify-center items-center">
        {/* Mode édition */}
        <input
          id={`button_${id}`}
          name={`button_${id}`}
          className={`nodrag w-full rounded-md px-3 py-2 text-center border-0 outline-none focus:outline-none focus:ring-0 bg-white ${editing ? '' : 'hidden'}`}
          autoFocus={editing}
          value={value}
          onChange={onInputChange}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
        />
        {/* Mode normal */}
        <button
          id={`button_view_${id}`}
          className={`cursor-pointer px-4 py-2 font-medium transition-colors hover:opacity-90 ${!editing ? '' : 'hidden'}`}
          onDoubleClick={onDoubleClick}
          style={computedStyle}
        >
          {displayLabel}
        </button>
      </div>
        {/* Handles pour connecter le nœud à d'autres nœuds */}
        <Handle type="source" position={Position.Top} id={`a`} className={`opacity-0`}/>
        <Handle type="target" position={Position.Bottom} id={`b`} className={`opacity-0`}/>
    </div>
  );
}
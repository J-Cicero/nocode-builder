import React, { useEffect, useState, useCallback } from "react";
import { useSelectedNode, getNodeData } from "../../../../selection";
import { Database, Link2, Unlink } from "lucide-react";
import { useParams } from "react-router-dom";
import schemaApi from "../../../../api/schemaApi";
import { useInterface } from "../../../../hooks/useInterface";

export default function DataBindingPart() {
  const { projectId } = useParams();
  const { updateComponent } = useInterface(projectId);
  const { selectedNodeId, getSelectedNode } = useSelectedNode();
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  
  // États locaux pour le formulaire
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Charger les tables
  useEffect(() => {
    if (!projectId) return;
    schemaApi.getSchema(projectId).then(res => {
      setTables(res.data?.tables || []);
    }).catch(console.error);
  }, [projectId]);

  // Synchroniser avec le noeud sélectionné
  useEffect(() => {
    const node = getSelectedNode();
    if (node && node.data?.component?.config?.dataBinding) {
      const db = node.data.component.config.dataBinding;
      setSelectedTable(db.tableId || "");
      setSelectedField(db.fieldId || "");
    } else {
      setSelectedTable("");
      setSelectedField("");
    }
  }, [selectedNodeId, getSelectedNode]);

  // Mettre à jour la liste des champs quand la table change
  useEffect(() => {
    if (selectedTable) {
      const table = tables.find(t => t.tracking_id === selectedTable);
      setFields(table?.fields || []);
    } else {
      setFields([]);
    }
  }, [selectedTable, tables]);

  if (!selectedNodeId) return null;

  const node = getSelectedNode();
  const isBound = !!(node?.data?.component?.config?.dataBinding?.tableId);

  const handleSaveBinding = async () => {
    if (!selectedNodeId) return;
    setIsSaving(true);
    
    try {
      const currentConfig = node.data?.component?.config || {};
      const newConfig = {
        ...currentConfig,
        dataBinding: selectedTable && selectedField ? {
          tableId: selectedTable,
          fieldId: selectedField
        } : null
      };

      await updateComponent(selectedNodeId, { config: newConfig });
      
      // Update local react flow state
      if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
         window.__reactFlowSetNodes.current(nds => nds.map(n => {
           if (n.id === selectedNodeId) {
             return {
               ...n,
               data: {
                 ...n.data,
                 component: {
                   ...n.data.component,
                   config: newConfig
                 }
               }
             };
           }
           return n;
         }));
      }
    } catch (err) {
      console.error("Erreur de liaison de données:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnbind = async () => {
    setSelectedTable("");
    setSelectedField("");
    
    if (!selectedNodeId) return;
    setIsSaving(true);
    try {
      const currentConfig = node.data?.component?.config || {};
      const newConfig = { ...currentConfig, dataBinding: null };
      await updateComponent(selectedNodeId, { config: newConfig });
      
      // Update local state
      if (window.__reactFlowSetNodes && window.__reactFlowSetNodes.current) {
         window.__reactFlowSetNodes.current(nds => nds.map(n => {
           if (n.id === selectedNodeId) {
             return { ...n, data: { ...n.data, component: { ...n.data.component, config: newConfig } } };
           }
           return n;
         }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Database className="w-4 h-4 text-purple-600 mr-2" />
          <h3 className="text-sm font-medium text-purple-800">Liaison aux Données</h3>
        </div>
        {isBound && (
          <button onClick={handleUnbind} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
            <Unlink size={12} />
            Détacher
          </button>
        )}
      </div>

      <div className="space-y-3 mt-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Source de Données (Table)
          </label>
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full text-xs p-2 border border-gray-300 rounded-md outline-none focus:border-purple-500"
          >
            <option value="">-- Aucune source --</option>
            {tables.map(t => (
              <option key={t.tracking_id} value={t.tracking_id}>{t.name}</option>
            ))}
          </select>
        </div>

        {selectedTable && (
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Champ à afficher
            </label>
            <select 
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-md outline-none focus:border-purple-500"
            >
              <option value="">-- Sélectionner un champ --</option>
              {fields.map(f => (
                <option key={f.tracking_id} value={f.tracking_id}>{f.name} ({f.field_type})</option>
              ))}
            </select>
          </div>
        )}

        {selectedTable && selectedField && (
          <button 
            onClick={handleSaveBinding}
            disabled={isSaving}
            className="w-full py-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Link2 size={14} />
            {isSaving ? "Liaison..." : "Lier la donnée"}
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useSelectedNode } from "../../../../selection";
import { Zap, Play } from "lucide-react";
import { useParams } from "react-router-dom";
import workflowsApi from "../../../../api/workflowsApi";
import { useInterface } from "../../../../hooks/useInterface";

export default function ActionPart() {
  const { projectId } = useParams();
  const { updateComponent } = useInterface(projectId);
  const { selectedNodeId, getSelectedNode } = useSelectedNode();
  const [workflows, setWorkflows] = useState([]);
  
  const [selectedEvent, setSelectedEvent] = useState("onClick");
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    workflowsApi.list(projectId).then(res => {
      setWorkflows(res.data || []);
    }).catch(console.error);
  }, [projectId]);

  useEffect(() => {
    const node = getSelectedNode();
    if (node && node.data?.component?.config?.events) {
      const evt = node.data.component.config.events[selectedEvent];
      setSelectedWorkflow(evt?.workflowId || "");
    } else {
      setSelectedWorkflow("");
    }
  }, [selectedNodeId, getSelectedNode, selectedEvent]);

  if (!selectedNodeId) return null;
  const node = getSelectedNode();
  // Ne montrer les actions que pour certains composants (Boutons, Formulaires, Cartes)
  const allowedTypes = ['buttonNode', 'formNode', 'cardNode'];
  if (!allowedTypes.includes(node?.type)) return null;

  const handleSaveAction = async () => {
    if (!selectedNodeId || !selectedWorkflow) return;
    setIsSaving(true);
    
    try {
      const currentConfig = node.data?.component?.config || {};
      const currentEvents = currentConfig.events || {};
      
      const newConfig = {
        ...currentConfig,
        events: {
          ...currentEvents,
          [selectedEvent]: {
            actionType: "trigger_workflow",
            workflowId: selectedWorkflow
          }
        }
      };

      await updateComponent(selectedNodeId, { config: newConfig });
      
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

  const handleRemoveAction = async () => {
    setIsSaving(true);
    try {
      const currentConfig = node.data?.component?.config || {};
      const currentEvents = { ...currentConfig.events };
      delete currentEvents[selectedEvent];
      
      const newConfig = { ...currentConfig, events: currentEvents };
      await updateComponent(selectedNodeId, { config: newConfig });
      setSelectedWorkflow("");
    } catch(e) {} finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center mb-3">
        <Zap className="w-4 h-4 text-orange-600 mr-2" />
        <h3 className="text-sm font-medium text-orange-800">Actions & Événements</h3>
      </div>

      <div className="space-y-3 mt-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Déclencheur
          </label>
          <select 
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full text-xs p-2 border border-gray-300 rounded-md outline-none focus:border-orange-500"
          >
            <option value="onClick">Au clic (onClick)</option>
            <option value="onSubmit">A la soumission (onSubmit)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Workflow à exécuter
          </label>
          <select 
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="w-full text-xs p-2 border border-gray-300 rounded-md outline-none focus:border-orange-500"
          >
            <option value="">-- Aucun Workflow --</option>
            {workflows.map(w => (
              <option key={w.tracking_id} value={w.tracking_id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-2">
          {selectedWorkflow && (
            <button 
              onClick={handleSaveAction}
              disabled={isSaving}
              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={14} />
              {isSaving ? "..." : "Connecter"}
            </button>
          )}
          {selectedWorkflow && (
             <button onClick={handleRemoveAction} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-md">
               Retirer
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

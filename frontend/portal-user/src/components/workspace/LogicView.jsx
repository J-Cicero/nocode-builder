import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Plus, Play, Settings, X, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import workflowsApi from '../../api/workflowsApi';
import useSchema from '../../hooks/useSchema';
import { useToast } from '../../context/ToastContext';

export default function LogicView() {
  const { projectId } = useParams();
  const toast = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tables } = useSchema(projectId);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newRuleName, setNewRuleName] = useState('');
  const [triggerTable, setTriggerTable] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('created');
  const [actionType, setActionType] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data } = await workflowsApi.list(projectId);
      setWorkflows(data || []);
    } catch (err) {
      console.error("Erreur chargement workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchWorkflows();
    }
  }, [projectId]);

  const handleCreateWorkflow = async () => {
    try {
      await workflowsApi.create(projectId, {
        name: newRuleName || "Nouvelle automatisation",
        description: "Règle générée via l'interface",
        is_active: true,
        trigger_type: "database",
        trigger_config: { table: triggerTable, event: triggerEvent },
        actions: [{ type: actionType, config: {} }]
      });
      setIsModalOpen(false);
      resetModal();
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors de la création de la règle.");
    }
  };

  const resetModal = () => {
    setStep(1);
    setNewRuleName('');
    setTriggerTable('');
    setTriggerEvent('created');
    setActionType('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBF4E9] overflow-hidden h-full">
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1A0E0A] mb-2">Automatisations</h2>
            <p className="text-[#7A5C44]">Définissez ce qui se passe automatiquement dans votre application.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary" 
            className="gap-2 shadow-xl shadow-[#C4622D]/20"
          >
            <Plus size={20} />
            Créer une automatisation
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-20 text-[#7A5C44]">Chargement des automatisations...</div>
          ) : workflows.map((wf) => (
            <div key={wf.tracking_id} className="bg-white p-6 rounded-3xl border border-[#E8D9C4] hover:border-[#C4622D] transition-all group flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${wf.is_active ? 'bg-[#FFF0E8] text-[#C4622D]' : 'bg-gray-100 text-gray-400'}`}>
                  <Zap size={28} fill={wf.is_active ? "currentColor" : "none"} />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                  <div>
                    <h3 className="font-bold text-[#1A0E0A] mb-1">{wf.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${wf.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {wf.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-[#FBF4E9] rounded-lg text-[11px] font-bold text-[#7A5C44] border border-[#E8D9C4]">
                      DÉCLENCHEUR
                    </div>
                    <span className="text-sm font-medium text-[#1A0E0A]">Sur évènement</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-[#1A0E0A] rounded-lg text-[11px] font-bold text-white">
                      ACTION
                    </div>
                    <span className="text-sm font-medium text-[#1A0E0A]">{wf.actions ? `${wf.actions.length} action(s)` : "Aucune action"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-[#FBF4E9] rounded-xl text-[#A08060] transition-colors" title="Paramètres">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && workflows.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-[#E8D9C4]">
             <div className="w-20 h-20 bg-[#FBF4E9] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C4622D]">
                <Zap size={40} />
             </div>
             <h3 className="text-xl font-bold text-[#1A0E0A] mb-2 font-serif">Aucune automatisation</h3>
             <p className="text-[#7A5C44] mb-8">Rendez votre application vivante en ajoutant des règles (ex: Envoyer un email quand un client s'inscrit).</p>
             <Button onClick={() => setIsModalOpen(true)} variant="primary">Créer ma première automatisation</Button>
          </div>
        )}
      </div>

      {/* MODAL 3 ETAPES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-[#1A0E0A]">
                {step === 1 ? '1. Le Déclencheur' : step === 2 ? '2. La Condition' : '3. L\'Action'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetModal(); }} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 flex-1">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'automatisation</label>
                    <input 
                      type="text" 
                      value={newRuleName}
                      onChange={e => setNewRuleName(e.target.value)}
                      placeholder="ex: Envoyer un email au nouveau client"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none mb-4"
                    />
                  </div>
                  <h4 className="font-bold text-lg text-[#1A0E0A] mb-4">Quand cela doit-il arriver ?</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600">Sur la collection...</label>
                      <select 
                        value={triggerTable}
                        onChange={e => setTriggerTable(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                      >
                        <option value="">Sélectionnez...</option>
                        {tables?.map(t => <option key={t.tracking_id} value={t.tracking_id}>{t.display_name || t.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600">Lorsqu'un élément est...</label>
                      <select 
                        value={triggerEvent}
                        onChange={e => setTriggerEvent(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                      >
                        <option value="created">Créé (Nouveau)</option>
                        <option value="updated">Modifié</option>
                        <option value="deleted">Supprimé</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in text-center py-10">
                  <h4 className="font-bold text-lg text-[#1A0E0A] mb-2">Ajouter une condition (Optionnel)</h4>
                  <p className="text-gray-500 mb-6">Voulez-vous restreindre cette automatisation ? (ex: Seulement si le client est Premium)</p>
                  <p className="text-xs text-orange-500 font-bold bg-orange-50 p-4 rounded-xl border border-orange-100">
                    Pour simplifier, nous passons cette étape dans cette version. L'action s'exécutera à chaque fois !
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <h4 className="font-bold text-lg text-[#1A0E0A] mb-4">Que doit faire l'application ?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'email', title: 'Envoyer un Email', desc: 'Envoyer un courriel automatique' },
                      { id: 'notification', title: 'Envoyer une Notification', desc: 'Alerte dans l\'application' },
                      { id: 'update', title: 'Mettre à jour', desc: 'Modifier une autre donnée' }
                    ].map(act => (
                      <button
                        key={act.id}
                        onClick={() => setActionType(act.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          actionType === act.id 
                            ? 'border-[#C4622D] bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`font-bold ${actionType === act.id ? 'text-[#C4622D]' : 'text-[#1A0E0A]'}`}>{act.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{act.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <button 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                className={`px-6 py-2.5 font-bold rounded-xl transition-colors ${step === 1 ? 'invisible' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Retour
              </button>

              <button 
                onClick={() => {
                  if (step < 3) setStep(s => s + 1);
                  else handleCreateWorkflow();
                }}
                disabled={(step === 1 && (!triggerTable || !newRuleName)) || (step === 3 && !actionType)}
                className="px-6 py-2.5 bg-[#1A0E0A] text-white font-bold rounded-xl hover:bg-[#C4622D] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {step < 3 ? 'Continuer' : 'Terminer & Activer'}
                {step < 3 && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

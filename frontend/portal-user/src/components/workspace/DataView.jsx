import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSchema from '../../hooks/useSchema';
import schemaApi from '../../api/schemaApi';
import { useToast } from '../../context/ToastContext';
import { Database, Plus, Trash2, X, Table as TableIcon, Hash, Type, Calendar, Mail, ToggleLeft } from 'lucide-react';

export default function DataView() {
  const { projectId } = useParams();
  const toast = useToast();
  const { tables, loading, refresh } = useSchema(projectId);
  
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  
  useEffect(() => {
    if (tables && tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    } else if (tables && selectedTable) {
      // Mettre à jour la table sélectionnée si elle a changé
      const updated = tables.find(t => t.tracking_id === selectedTable.tracking_id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    try {
      await schemaApi.createTable(projectId, {
        name: newTableName.toLowerCase().replace(/\s+/g, '_'),
        display_name: newTableName,
        description: `Table ${newTableName}`
      });
      setNewTableName('');
      setIsTableModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors de la création.");
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newFieldName.trim() || !selectedTable) return;
    try {
      await schemaApi.createField(selectedTable.tracking_id, {
        name: newFieldName.toLowerCase().replace(/\s+/g, '_'),
        display_name: newFieldName,
        type: newFieldType,
        required: false,
        unique: false
      });
      setNewFieldName('');
      setNewFieldType('text');
      setIsFieldModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors de l'ajout du champ.");
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Supprimer cette information ?")) return;
    try {
      await schemaApi.deleteField(fieldId);
      refresh();
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors de la suppression.");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer toute cette collection et toutes ses informations ?")) return;
    try {
      await schemaApi.deleteTable(tableId);
      setSelectedTable(null);
      refresh();
    } catch (err) {
      console.error(err);
      toast.alert(err.userMessage || "Erreur lors de la suppression de la collection.");
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'number': return <Hash size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'email': return <Mail size={16} />;
      case 'boolean': return <ToggleLeft size={16} />;
      default: return <Type size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'text': return "Texte court";
      case 'number': return "Nombre";
      case 'date': return "Date";
      case 'email': return "Adresse Email";
      case 'boolean': return "Vrai / Faux (Bouton switch)";
      default: return type;
    }
  };

  return (
    <div className="flex-1 flex bg-[#FBF4E9] overflow-hidden h-full">
      {/* Colonne Gauche : Liste des Tables */}
      <aside className="w-72 bg-white border-r border-[#E8D9C4] flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-[#FBF4E9]">
          <h2 className="text-xl font-bold text-[#1A0E0A] font-serif mb-1">Collections</h2>
          <p className="text-xs text-[#7A5C44]">Gérez les données de votre app.</p>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setIsTableModalOpen(true)}
            className="w-full bg-[#1A0E0A] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#C4622D] transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={16} />
            Nouvelle Collection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
          {loading ? (
            <div className="text-center text-sm text-[#7A5C44] py-4">Chargement...</div>
          ) : tables?.map((table) => (
            <button
              key={table.tracking_id}
              onClick={() => setSelectedTable(table)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                selectedTable?.tracking_id === table.tracking_id
                  ? 'bg-orange-50 border-[#C4622D] shadow-sm'
                  : 'bg-white border-transparent hover:border-[#E8D9C4] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTable?.tracking_id === table.tracking_id ? 'bg-[#C4622D] text-white' : 'bg-[#FBF4E9] text-[#7A5C44]'}`}>
                  <Database size={14} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${selectedTable?.tracking_id === table.tracking_id ? 'text-[#1A0E0A]' : 'text-gray-700'}`}>
                    {table.display_name || table.name}
                  </div>
                  <div className="text-[10px] text-[#A08060] uppercase tracking-wider mt-0.5">
                    {table.fields?.length || 0} informations
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Colonne Droite : Détails de la Table */}
      <main className="flex-1 overflow-y-auto p-10">
        {selectedTable ? (
          <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-[#E8D9C4] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#FBF4E9] flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-[#C4622D] rounded-2xl flex items-center justify-center">
                  <TableIcon size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A0E0A] flex items-center gap-3">
                    {selectedTable.display_name || selectedTable.name}
                    <button 
                      onClick={() => handleDeleteTable(selectedTable.tracking_id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer la collection"
                    >
                      <Trash2 size={18} />
                    </button>
                  </h1>
                  <p className="text-sm text-[#7A5C44]">Définissez les informations que contient cette collection.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFieldModalOpen(true)}
                className="px-5 py-2.5 bg-[#C4622D] text-white text-sm font-bold rounded-xl hover:bg-[#A04E22] transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Ajouter une information
              </button>
            </div>

            <div className="p-8">
              {(!selectedTable.fields || selectedTable.fields.length === 0) ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4 shadow-sm">
                    <Database size={24} />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Aucune information</h3>
                  <p className="text-sm text-gray-500">Ajoutez le premier champ pour cette collection.</p>
                </div>
              ) : (
                <div className="border border-[#E8D9C4] rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#E8D9C4]">
                        <th className="p-4 text-xs font-bold text-[#A08060] uppercase tracking-wider w-1/3">Nom de l'information</th>
                        <th className="p-4 text-xs font-bold text-[#A08060] uppercase tracking-wider w-1/3">Type de donnée</th>
                        <th className="p-4 text-xs font-bold text-[#A08060] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FBF4E9]">
                      {selectedTable.fields.map(field => (
                        <tr key={field.tracking_id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="p-4">
                            <div className="font-bold text-[#1A0E0A] text-sm">{field.display_name || field.name}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg w-max">
                              <span className="text-gray-400">{getTypeIcon(field.type)}</span>
                              {getTypeLabel(field.type)}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDeleteField(field.tracking_id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Sélectionnez une collection pour voir ses détails
          </div>
        )}
      </main>

      {/* Modal Nouvelle Table */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#1A0E0A]">Créer une collection</h3>
              <button onClick={() => setIsTableModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la collection</label>
                <input 
                  type="text" 
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  placeholder="ex: Utilisateurs, Produits, Commandes"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                disabled={!newTableName.trim()}
                className="w-full bg-[#1A0E0A] text-white font-bold py-3 rounded-xl hover:bg-[#C4622D] transition-colors disabled:opacity-50"
              >
                Créer la collection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouveau Champ */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#1A0E0A]">Ajouter une information</h3>
              <button onClick={() => setIsFieldModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateField} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'information</label>
                <input 
                  type="text" 
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  placeholder="ex: Titre, Prix, Description"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type de donnée</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'text', icon: <Type size={16}/>, label: 'Texte court (Nom, Titre)' },
                    { id: 'number', icon: <Hash size={16}/>, label: 'Nombre (Prix, Quantité)' },
                    { id: 'date', icon: <Calendar size={16}/>, label: 'Date (Date de naissance)' },
                    { id: 'email', icon: <Mail size={16}/>, label: 'Email' },
                    { id: 'boolean', icon: <ToggleLeft size={16}/>, label: 'Vrai/Faux (Case à cocher)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewFieldType(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        newFieldType === t.id 
                          ? 'border-[#C4622D] bg-orange-50 text-[#C4622D]' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className={newFieldType === t.id ? 'text-[#C4622D]' : 'text-gray-400'}>{t.icon}</div>
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                disabled={!newFieldName.trim()}
                className="w-full bg-[#C4622D] text-white font-bold py-3 rounded-xl hover:bg-[#A04E22] transition-colors disabled:opacity-50 mt-2"
              >
                Ajouter à la collection
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

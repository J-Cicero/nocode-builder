import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Folder, 
  Database, 
  Settings, 
  Trash2, 
  Eye, 
  LayoutGrid, 
  LayoutList,
  Search,
  ChevronRight
} from 'lucide-react';
import useSchema from '../../hooks/useSchema';
import schemaApi from '../../api/schemaApi';
import { useToast } from '../../context/ToastContext';

export default function SimplifiedDataView() {
  const { projectId } = useParams();
  const toast = useToast();
  const { tables, loading, refresh } = useSchema(projectId);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateCollection = async () => {
    const name = prompt("Quel est le nom de cette nouvelle collection ? (ex: Mes Clients, Produits, Commandes)");
    if (!name) return;

    try {
      await schemaApi.createTable(projectId, {
        name: name.toLowerCase().replace(/\s+/g, '_'),
        display_name: name,
        description: `Collection de ${name}`
      });
      refresh();
    } catch (err) {
      console.error("Erreur creation collection:", err);
      toast.alert(err.userMessage || "Une erreur est survenue lors de la création.");
    }
  };

  const filteredTables = tables?.filter(t => 
    (t.display_name || t.name).toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 flex flex-col bg-[#FBF4E9] overflow-hidden h-full">
      {/* Header de la vue */}
      <div className="px-8 py-6 bg-white border-b border-[#E8D9C4] flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1A0E0A] flex items-center gap-2">
            <Database className="text-[#C4622D]" size={24} />
            Mes Données
          </h2>
          <p className="text-sm text-[#7A5C44]">Gérez les informations que votre application va stocker.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher une collection..."
              className="pl-10 pr-4 py-2 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl text-sm focus:ring-2 focus:ring-[#C4622D] outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-[#FBF4E9] p-1 rounded-xl border border-[#E8D9C4]">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#C4622D] shadow-sm' : 'text-[#A08060]'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#C4622D] shadow-sm' : 'text-[#A08060]'}`}
            >
              <LayoutList size={18} />
            </button>
          </div>

          <button 
            onClick={handleCreateCollection}
            className="bg-[#1A0E0A] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#2C1A0E] transition-all flex items-center gap-2 shadow-lg shadow-[#1A0E0A]/10 active:scale-95"
          >
            <Plus size={18} />
            Nouvelle Collection
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C4622D]"></div>
            <p className="text-[#7A5C44] font-medium italic">Préparation de vos données...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#E8D9C4]/50 border border-[#F1F5F9]">
              <Folder size={40} className="text-[#C4622D]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A0E0A] mb-2 font-serif">Aucune collection</h3>
            <p className="text-[#7A5C44] mb-8">
              C'est ici que vous définissez ce que votre application doit mémoriser (vos clients, vos produits, vos réservations, etc.).
            </p>
            <button 
              onClick={handleCreateCollection}
              className="bg-[#C4622D] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#A65124] transition-all shadow-xl shadow-[#C4622D]/20 active:scale-95"
            >
              Créer ma première collection
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => (
              <div 
                key={table.tracking_id} 
                className="bg-white rounded-[2rem] p-6 border border-[#E8D9C4] hover:border-[#C4622D] hover:shadow-2xl hover:shadow-[#C4622D]/5 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-[#7A5C44]">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                <div className="w-14 h-14 bg-[#FBF4E9] rounded-2xl flex items-center justify-center mb-6 text-[#C4622D] group-hover:scale-110 transition-transform">
                  <Folder size={28} fill="currentColor" fillOpacity={0.1} />
                </div>

                <h3 className="text-xl font-bold text-[#1A0E0A] mb-1 font-serif group-hover:text-[#C4622D] transition-colors">
                  {table.display_name || table.name}
                </h3>
                <p className="text-xs text-[#7A5C44] uppercase tracking-widest font-bold mb-4">
                  {table.fields?.length || 0} champs d'information
                </p>

                <div className="space-y-2 mb-6">
                  {table.fields?.slice(0, 3).map(field => (
                    <div key={field.tracking_id} className="flex items-center gap-2 text-sm text-[#2C1A0E]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]"></div>
                      {field.display_name || field.name}
                    </div>
                  ))}
                  {(table.fields?.length || 0) > 3 && (
                    <div className="text-xs text-[#A08060] italic ml-3">
                      + {table.fields.length - 3} autres...
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[#C4622D] font-bold text-sm">
                  <span>Ouvrir la collection</span>
                  <ChevronRight size={18} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-[#E8D9C4] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[#7A5C44] text-xs font-bold uppercase tracking-wider">
                  <th className="px-8 py-4">Nom de la Collection</th>
                  <th className="px-8 py-4">Champs</th>
                  <th className="px-8 py-4">Dernière modification</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTables.map((table) => (
                  <tr key={table.tracking_id} className="hover:bg-[#FBF4E9]/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FBF4E9] rounded-xl flex items-center justify-center text-[#C4622D]">
                          <Folder size={20} />
                        </div>
                        <span className="font-bold text-[#1A0E0A]">{table.display_name || table.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-bold text-[#7A5C44]">
                        {table.fields?.length || 0} CHAMPS
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-[#7A5C44]">
                      {new Date(table.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-white rounded-lg text-[#A08060] transition-all">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-[#A08060] transition-all">
                          <Settings size={18} />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

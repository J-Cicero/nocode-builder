import React, { useState } from 'react';
import { X, Layout, Plus, Loader2, Sparkles, Globe, Lock } from 'lucide-react';
import Button from '../common/Button';

export default function NewProjectModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(formData);
      setFormData({ name: '', description: '', is_public: false });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1A0E0A]/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-[#E8D9C4] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative Top Bar */}
        <div className="h-2 bg-gradient-to-r from-[#C4622D] via-[#D4A017] to-[#C4622D]" />
        
        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FBF4E9] rounded-full text-[#C4622D] text-[10px] font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                Nouvelle Aventure
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#1A0E0A]">Créer un projet</h2>
              <p className="text-[#7A5C44]">Définissez les bases de votre nouvelle application.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#FBF4E9] rounded-xl text-[#A08060] transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A0E0A] flex items-center gap-2">
                Nom du Projet
              </label>
              <div className="relative">
                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" size={18} />
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-[#FBF4E9] border border-[#E8D9C4] rounded-2xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all placeholder:text-[#A08060]/40"
                  placeholder="Ex: Ma Super App, Boutique EnoC..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A0E0A]">Description (Optionnel)</label>
              <textarea
                className="w-full p-4 bg-[#FBF4E9] border border-[#E8D9C4] rounded-2xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all placeholder:text-[#A08060]/40 min-h-[100px] resize-none"
                placeholder="À quoi sert votre application ?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 py-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: true })}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${formData.is_public ? 'border-[#C4622D] bg-[#FFF0E8]' : 'border-[#E8D9C4] bg-white hover:border-[#C4622D]/30'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_public ? 'bg-[#C4622D] text-white' : 'bg-[#FBF4E9] text-[#7A5C44]'}`}>
                  <Globe size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1A0E0A]">Public</div>
                  <div className="text-[10px] text-[#7A5C44]">Visible par la communauté</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: false })}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${!formData.is_public ? 'border-[#1A0E0A] bg-gray-50' : 'border-[#E8D9C4] bg-white hover:border-[#1A0E0A]/30'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!formData.is_public ? 'bg-[#1A0E0A] text-white' : 'bg-[#FBF4E9] text-[#7A5C44]'}`}>
                  <Lock size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1A0E0A]">Privé</div>
                  <div className="text-[10px] text-[#7A5C44]">Seulement vous y avez accès</div>
                </div>
              </button>
            </div>

            <div className="pt-4 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 rounded-2xl"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                variant="primary" 
                className="flex-[2] rounded-2xl gap-2 shadow-xl shadow-[#C4622D]/20"
                disabled={loading || !formData.name}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <Plus size={20} />
                    Créer le Projet
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

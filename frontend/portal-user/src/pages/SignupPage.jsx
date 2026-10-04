import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import Button from '../components/common/Button';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register: signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Le mot de passe doit comporter au moins 8 caractères, dont une lettre, un chiffre et un caractère spécial (@$!%*?&).');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await signup(formData, 'free');
      navigate('/app/dashboard');
    } catch (err) {
      if (err.response?.status === 422) {
        setError("Veuillez vérifier les informations saisies (8+ caractères, 1 chiffre et 1 symbole requis).");
      } else {
        setError(err.message || "Échec de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FBF4E9] font-sans">
      {/* Left Side: Visual Content */}
      <div className="hidden lg:flex flex-[0.8] bg-[#1A0E0A] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#C4622D] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 bg-[#C4622D] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-4xl mx-auto mb-10 shadow-2xl">E</div>
          <h2 className="text-4xl font-serif font-bold text-white mb-6">Rejoignez la révolution No-Code.</h2>
          <p className="text-white/60 text-lg mb-12">Créez des outils qui changent le quotidien, sans limites techniques.</p>
          
          <div className="space-y-4 text-left">
            {[
              "Gratuit pour les créateurs individuels",
              "Accès à tous les composants visuels",
              "Hébergement cloud sécurisé inclus",
              "Support communautaire actif"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 size={20} className="text-[#D4A017]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C4622D 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white shadow-2xl z-10 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-[#1A0E0A]">Créez votre compte</h1>
            <p className="text-[#7A5C44]">Commencez votre voyage avec EnoC aujourd'hui.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">Prénom</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all text-sm"
                    placeholder="Jean"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">Nom</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all text-sm"
                    placeholder="Dupont"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">Adresse Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all text-sm"
                  placeholder="nom@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Min 8 car., 1 lettre, 1 chiffre, 1 spécial (@$!%*?&#._-)</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">Confirmation</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4622D]" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] outline-none transition-all text-sm"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-14 text-lg shadow-lg shadow-[#C4622D]/20 mt-4"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Créer mon compte
                  <ArrowRight className="ml-2" size={20} />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-[#7A5C44] text-sm">
            Vous avez déjà un compte ?{' '}
            <button 
              onClick={() => navigate('/auth/login')}
              className="text-[#C4622D] font-bold hover:underline"
            >
              Connectez-vous ici
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import Button from '../components/common/Button';
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FBF4E9] font-sans">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 bg-white shadow-2xl z-10">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-4">
            <div 
              className="w-12 h-12 bg-[#C4622D] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl cursor-pointer"
              onClick={() => navigate('/')}
            >
              E
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#1A0E0A]">Bon retour !</h1>
            <p className="text-[#7A5C44] text-lg">Continuez à bâtir vos idées sur EnoC.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A0E0A] flex items-center gap-2">
                <Mail size={16} className="text-[#C4622D]" />
                Adresse Email
              </label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] focus:border-transparent outline-none transition-all placeholder:text-[#A08060]/50"
                placeholder="nom@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#1A0E0A] flex items-center gap-2">
                  <Lock size={16} className="text-[#C4622D]" />
                  Mot de passe
                </label>
                <button type="button" className="text-sm text-[#C4622D] font-bold hover:underline">Oublié ?</button>
              </div>
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-[#FBF4E9] border border-[#E8D9C4] rounded-xl focus:ring-2 focus:ring-[#C4622D] focus:border-transparent outline-none transition-all placeholder:text-[#A08060]/50"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-14 text-lg shadow-lg shadow-[#C4622D]/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-[#7A5C44]">
            Pas encore de compte ?{' '}
            <button 
              onClick={() => navigate('/auth/signup')}
              className="text-[#C4622D] font-bold hover:underline"
            >
              Inscrivez-vous gratuitement
            </button>
          </p>
        </div>
      </div>

      {/* Right Side: Visual Content */}
      <div className="hidden lg:flex flex-[1.2] bg-[#1A0E0A] relative overflow-hidden items-center justify-center p-20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4622D] opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4A017] opacity-10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C4622D]/20 border border-[#C4622D]/30 rounded-full text-[#D4A017] text-sm font-bold mb-8">
            <Sparkles size={16} />
            <span>Nouveau sur EnoC</span>
          </div>
          <h2 className="text-5xl font-serif font-bold text-white mb-8 leading-tight">
            Propulsez votre créativité avec le studio <span className="text-[#C4622D]">EnoC</span>.
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#C4622D] rounded-xl flex items-center justify-center shrink-0">
                <Layout className="text-white" size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Visual Builder</h4>
                <p className="text-white/60 text-sm">Créez des interfaces professionnelles en glissant-déposant.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#D4A017] rounded-xl flex items-center justify-center shrink-0">
                <Database className="text-[#1A0E0A]" size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Dynamic Data</h4>
                <p className="text-white/60 text-sm">Modélisez vos données métiers intuitivement.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract pattern grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C4622D 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
    </div>
  );
}

// Additional icons needed
const Layout = ({ className, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const Database = ({ className, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

/**
 * EnoC Design System - African-Inspired Professional Palette
 * 
 * Palette:
 * - Terracotta (Main): #C4622D (Earth, Energy, Clay)
 * - Savanna Gold: #D4A017 (Sun, Prosperity, Wealth)
 * - Deep Charcoal: #1A0E0A (Strength, Foundation, Night)
 * - Sandstone: #FBF4E9 (Base, Clarity, Space)
 * - Ochre Accents: #A04E24 (Tradition, Warmth)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Database, Layout, Shield, Globe, Menu, X } from 'lucide-react';
import Button from '../components/common/Button';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl border border-[#E8D9C4] hover:border-[#C4622D] transition-all group shadow-sm hover:shadow-md">
    <div className="w-12 h-12 bg-[#FBF4E9] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C4622D] transition-colors">
      <Icon className="text-[#C4622D] group-hover:text-white transition-colors" size={24} />
    </div>
    <h3 className="text-xl font-bold text-[#1A0E0A] mb-3 font-serif">{title}</h3>
    <p className="text-[#7A5C44] leading-relaxed">{description}</p>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FBF4E9] font-sans text-[#1A0E0A]">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#FBF4E9]/80 backdrop-blur-md border-b border-[#E8D9C4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-[#C4622D] rounded-lg flex items-center justify-center text-white font-serif font-bold text-2xl">E</div>
              <span className="text-2xl font-serif font-bold text-[#1A0E0A]">EnoC</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#7A5C44] hover:text-[#C4622D] font-medium transition-colors">Fonctionnalités</a>
              <a href="#templates" className="text-[#7A5C44] hover:text-[#C4622D] font-medium transition-colors">Modèles</a>
              <a href="#pricing" className="text-[#7A5C44] hover:text-[#C4622D] font-medium transition-colors">Tarifs</a>
              <button 
                onClick={() => navigate('/auth/login')}
                className="text-[#1A0E0A] font-bold hover:text-[#C4622D] transition-colors"
              >
                Connexion
              </button>
              <Button variant="primary" onClick={() => navigate('/auth/signup')}>
                Essayer Gratuitement
              </Button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-[#1A0E0A]">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E8D9C4] p-4 space-y-4">
            <a href="#features" className="block px-4 py-2 text-[#7A5C44] font-medium">Fonctionnalités</a>
            <button 
              onClick={() => navigate('/auth/login')}
              className="block w-full text-left px-4 py-2 text-[#1A0E0A] font-bold"
            >
              Connexion
            </button>
            <div className="px-4">
              <Button variant="primary" className="w-full" onClick={() => navigate('/auth/signup')}>
                S'inscrire
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF0E8] rounded-full text-[#C4622D] text-sm font-bold mb-8 animate-fade-in">
            <Zap size={16} fill="currentColor" />
            <span>Le premier studio No-Code né en Afrique</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#1A0E0A] mb-8 leading-tight">
            Construisez des applications <br />
            <span className="text-[#C4622D]">sans une ligne de code.</span>
          </h1>
          <p className="text-xl text-[#7A5C44] max-w-2xl mx-auto mb-12 leading-relaxed">
            EnoC combine la puissance du développement moderne avec une simplicité visuelle intuitive. Donnez vie à vos idées en quelques minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="primary" 
              size="lg" 
              className="px-10 h-14 text-lg shadow-xl shadow-[#C4622D]/20"
              onClick={() => navigate('/auth/signup')}
            >
              Commencer l'aventure
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <button className="px-8 h-14 text-[#1A0E0A] font-bold hover:bg-white/50 rounded-xl transition-all border border-transparent hover:border-[#E8D9C4]">
              Voir la démo
            </button>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#C4622D] to-[#D4A017] rounded-[2rem] blur-2xl opacity-10 animate-pulse"></div>
            <div className="relative bg-white rounded-2xl border border-[#E8D9C4] shadow-2xl overflow-hidden aspect-video flex items-center justify-center group">
               <div className="absolute inset-0 bg-[#1A0E0A]/5 group-hover:bg-transparent transition-colors"></div>
               <div className="z-10 text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg text-[#C4622D] mb-4 cursor-pointer hover:scale-110 transition-transform">
                    <Play size={32} fill="currentColor" className="ml-1" />
                  </div>
                  <span className="font-bold text-[#1A0E0A]">Découvrez EnoC en 2 minutes</span>
               </div>
               {/* Decorative dots grid */}
               <div className="absolute top-0 right-0 p-8 grid grid-cols-4 gap-2 opacity-20">
                  {[...Array(16)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#C4622D] rounded-full"></div>)}
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Templates Section */}
      <section id="templates" className="py-24 bg-[#FBF4E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1A0E0A] mb-4">
                Prêt à l'emploi
              </h2>
              <p className="text-[#7A5C44] text-lg">
                Gagnez du temps avec nos modèles conçus pour les besoins du continent.
              </p>
            </div>
            <button className="text-[#C4622D] font-bold flex items-center gap-2 hover:gap-3 transition-all">
              Voir tous les modèles <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Boutique Artisanale", tag: "E-commerce", desc: "Vendez vos créations partout dans le monde avec paiement mobile intégré." },
              { title: "Gestion de Clinique", tag: "Santé", desc: "Suivi des patients et prise de rendez-vous pour les centres de santé locaux." },
              { title: "EnoC Marketplace", tag: "Logistique", desc: "Connectez les producteurs locaux aux acheteurs en milieu urbain." }
            ].map((tpl, i) => (
              <div key={i} className="group bg-white rounded-3xl border border-[#E8D9C4] overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="aspect-[4/3] bg-[#1A0E0A] relative flex items-center justify-center p-12">
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#C4622D 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                   <div className="w-full h-full border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                      <Layout className="text-white/20" size={48} />
                   </div>
                   <div className="absolute top-4 left-4 px-3 py-1 bg-[#D4A017] text-[#1A0E0A] text-[10px] font-bold rounded-full uppercase tracking-widest">
                     {tpl.tag}
                   </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[#1A0E0A] font-serif mb-2 group-hover:text-[#C4622D] transition-colors">{tpl.title}</h3>
                  <p className="text-[#7A5C44] text-sm leading-relaxed mb-6">{tpl.desc}</p>
                  <button className="w-full py-3 bg-[#FBF4E9] text-[#1A0E0A] font-bold rounded-xl group-hover:bg-[#C4622D] group-hover:text-white transition-all">
                    Utiliser ce modèle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1A0E0A] mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-[#7A5C44] text-lg max-w-xl mx-auto">
              Une suite d'outils puissants conçus pour la performance et la simplicité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Layout}
              title="Éditeur Visuel"
              description="Créez des interfaces professionnelles par simple glisser-déposer. Pas besoin de CSS."
            />
            <FeatureCard 
              icon={Database}
              title="Données Intelligentes"
              description="Modélisez vos objets métiers sans SQL. EnoC s'occupe de la base de données pour vous."
            />
            <FeatureCard 
              icon={Zap}
              title="Logique Métier"
              description="Ajoutez des workflows automatiques et des conditions sans écrire de scripts complexes."
            />
            <FeatureCard 
              icon={Globe}
              title="Déploiement en 1 clic"
              description="Publiez votre application instantanément sur le web avec un hébergement sécurisé."
            />
            <FeatureCard 
              icon={Shield}
              title="Sécurité Native"
              description="Protection des données et authentification intégrée selon les standards du marché."
            />
            <FeatureCard 
              icon={ArrowRight}
              title="Export Full Code"
              description="Besoin de plus ? Exportez votre application en code React/Node propre à tout moment."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-[#1A0E0A] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#C4622D] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4A017] opacity-10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8 relative z-10">
            Prêt à transformer vos idées ?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto relative z-10">
            Rejoignez la nouvelle génération de créateurs africains qui construisent l'avenir numérique du continent.
          </p>
          <div className="relative z-10">
            <Button 
              variant="primary" 
              size="lg" 
              className="bg-[#D4A017] hover:bg-[#B88A14] px-12 h-14"
              onClick={() => navigate('/auth/signup')}
            >
              Lancer mon projet maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#E8D9C4]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#C4622D] rounded flex items-center justify-center text-white font-serif font-bold text-lg">E</div>
            <span className="text-xl font-serif font-bold text-[#1A0E0A]">EnoC</span>
          </div>
          <p className="text-[#7A5C44] text-sm">
            © 2026 EnoC Studio. Fièrement construit en Afrique pour le monde entier.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Simple Play Icon for the visual
const Play = ({ size, fill, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

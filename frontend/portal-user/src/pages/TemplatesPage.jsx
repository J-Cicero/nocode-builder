import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/**
 * Page de templates (Modèles)
 * Affiche les modèles disponibles pour créer de nouveaux projets
 */
export default function TemplatesPage() {
  const templates = [
    { id: 1, name: 'SaaS Dashboard', description: 'Tableau de bord complet pour application SaaS' },
    { id: 2, name: 'Landing Page', description: 'Page d\'accueil moderne et épurée' },
    { id: 3, name: 'E-commerce', description: 'Boutique en ligne avec panier et produits' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4E9]">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[#2C1A0E] mb-4">Modèles d'applications</h1>
          <p className="text-[#7A5C44] text-lg max-w-2xl mx-auto">
            Choisissez un modèle pour démarrer votre projet plus rapidement.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-[#E8D9C4] overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Aperçu du modèle</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2C1A0E] mb-2">{template.name}</h3>
                <p className="text-[#7A5C44] text-sm mb-4">{template.description}</p>
                <button className="w-full py-2 bg-[#C4622D] text-white rounded-lg font-medium hover:bg-[#A04E22] transition-colors">
                  Utiliser ce modèle
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

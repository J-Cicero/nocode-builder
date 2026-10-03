import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import projectsApi from '../api/projectsApi';
import interfaceApi from '../api/interfaceApi';
import { useToast } from '../context/ToastContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Check, 
  Layers 
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics & Dashboard',
    category: 'Productivité',
    icon: LayoutDashboard,
    badge: 'Populaire',
    description: 'Tableau de bord complet pour application SaaS avec KPIs en temps réel, gestion des utilisateurs et facturation.',
    features: ['Indicateurs clés (KPIs)', 'Tableau de données dynamique', 'Page de configuration & profil'],
    pages: [
      {
        nom: 'Tableau de bord',
        chemin: '/',
        est_accueil: true,
        type_page: 'desktop',
        ordre: 1,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation Principale',
            config: {
              title: 'SaaS Pulse',
              links: [
                { label: 'Tableau de bord', path: '/' },
                { label: 'Paramètres', path: '/settings' },
              ],
            },
          },
          {
            type: 'stats-row',
            ordre: 2,
            title: 'Métriques clés',
            config: {
              stats: [
                { label: 'Utilisateurs Actifs', value: '1,420', change: '+12%' },
                { label: 'Revenu Mensuel (MRR)', value: '18,500 €', change: '+8%' },
                { label: 'Taux de Rétention', value: '96.4%', change: '+1.2%' },
              ],
            },
          },
          {
            type: 'data-table',
            ordre: 3,
            title: 'Derniers Abonnements',
            config: {
              columns: ['Client', 'Plan', 'Statut', 'Date'],
              table: 'subscriptions',
            },
          },
        ],
      },
      {
        nom: 'Paramètres',
        chemin: '/settings',
        est_accueil: false,
        type_page: 'desktop',
        ordre: 2,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation Principale',
            config: {
              title: 'SaaS Pulse',
              links: [
                { label: 'Tableau de bord', path: '/' },
                { label: 'Paramètres', path: '/settings' },
              ],
            },
          },
          {
            type: 'form',
            ordre: 2,
            title: 'Informations de l’Organisation',
            config: {
              fields: [
                { name: 'org_name', label: 'Nom de l’entreprise', type: 'text' },
                { name: 'billing_email', label: 'Email de facturation', type: 'email' },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'crm-sales',
    name: 'CRM & Pipeline Commercial',
    category: 'Ventes',
    icon: Users,
    badge: 'Nouveau',
    description: 'Solution prête à l’emploi pour centraliser vos prospects, suivre vos opportunités et convertir vos clients.',
    features: ['Pipeline d’opportunités', 'Fiches prospects complètes', 'Formulaire de capture de lead'],
    pages: [
      {
        nom: 'Pipeline Ventes',
        chemin: '/',
        est_accueil: true,
        type_page: 'desktop',
        ordre: 1,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation',
            config: {
              title: 'CRM Hub',
              links: [
                { label: 'Contacts', path: '/' },
                { label: 'Ajouter un prospect', path: '/nouveau-lead' },
              ],
            },
          },
          {
            type: 'stats-row',
            ordre: 2,
            title: 'Indicateurs de Vente',
            config: {
              stats: [
                { label: 'Prospects Qualifiés', value: '84', change: '+5' },
                { label: 'Opportunités en cours', value: '42,000 €', change: '+15%' },
                { label: 'Taux de conversion', value: '24%', change: '+3%' },
              ],
            },
          },
          {
            type: 'data-table',
            ordre: 3,
            title: 'Répertoire des Contacts',
            config: {
              columns: ['Nom', 'Société', 'Email', 'Statut Commercial'],
              table: 'leads',
            },
          },
        ],
      },
      {
        nom: 'Nouveau Prospect',
        chemin: '/nouveau-lead',
        est_accueil: false,
        type_page: 'desktop',
        ordre: 2,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation',
            config: {
              title: 'CRM Hub',
              links: [
                { label: 'Contacts', path: '/' },
                { label: 'Ajouter un prospect', path: '/nouveau-lead' },
              ],
            },
          },
          {
            type: 'form',
            ordre: 2,
            title: 'Fiche d’un Nouveau Prospect',
            config: {
              fields: [
                { name: 'name', label: 'Nom complet', type: 'text' },
                { name: 'company', label: 'Entreprise', type: 'text' },
                { name: 'email', label: 'Adresse Email', type: 'email' },
                { name: 'phone', label: 'Téléphone', type: 'tel' },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'e-commerce',
    name: 'Boutique & Catalogue Produits',
    category: 'Commerce',
    icon: ShoppingBag,
    badge: 'Recommandé',
    description: 'Interface e-commerce moderne avec bannière d’offres, vitrine sous forme de grille et gestion des commandes.',
    features: ['Bannière héro promotionnelle', 'Grille de cartes produits', 'Tableau de suivi des commandes'],
    pages: [
      {
        nom: 'Boutique en Ligne',
        chemin: '/',
        est_accueil: true,
        type_page: 'desktop',
        ordre: 1,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation E-commerce',
            config: {
              title: 'Boutique Moderne',
              links: [
                { label: 'Boutique', path: '/' },
                { label: 'Commandes', path: '/commandes' },
              ],
            },
          },
          {
            type: 'hero',
            ordre: 2,
            title: 'Offres Exceptionnelles',
            config: {
              title: 'Nouvelle Collection Disponible',
              subtitle: 'Découvrez notre sélection exclusive d’articles artisanaux et innovants.',
              cta: { label: 'Explorer le catalogue', href: '#catalogue' },
            },
          },
          {
            type: 'card-grid',
            ordre: 3,
            title: 'Nos Produits Vedettes',
            config: {
              columns: 3,
              card_fields: ['title', 'price', 'description'],
              table: 'products',
            },
          },
        ],
      },
      {
        nom: 'Gestion des Commandes',
        chemin: '/commandes',
        est_accueil: false,
        type_page: 'desktop',
        ordre: 2,
        sections: [
          {
            type: 'navbar',
            ordre: 1,
            title: 'Navigation E-commerce',
            config: {
              title: 'Boutique Moderne',
              links: [
                { label: 'Boutique', path: '/' },
                { label: 'Commandes', path: '/commandes' },
              ],
            },
          },
          {
            type: 'data-table',
            ordre: 2,
            title: 'Historique des Commandes',
            config: {
              columns: ['Numéro Commande', 'Client', 'Total TTC', 'État Livraison'],
              table: 'orders',
            },
          },
        ],
      },
    ],
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);

  const handleApplyTemplate = async (template) => {
    setLoadingTemplateId(template.id);
    try {
      // 1. Créer le projet
      const projectPayload = {
        name: `${template.name} (Modèle)`,
        description: template.description,
        is_public: false,
      };

      const { data: project } = await projectsApi.create(projectPayload);
      const projectId = project.tracking_id || project.uuid || project.id;

      // 2. Initialiser les pages et sections du modèle
      for (const pageData of template.pages) {
        const { data: createdPage } = await interfaceApi.createPage(projectId, {
          nom: pageData.nom,
          chemin: pageData.chemin,
          type_page: pageData.type_page,
          est_accueil: pageData.est_accueil,
          ordre: pageData.ordre,
        });

        const pageId = createdPage.tracking_id || createdPage.id;

        // Créer les sections associées à la page
        if (pageData.sections && pageData.sections.length > 0 && pageId) {
          for (const section of pageData.sections) {
            try {
              await interfaceApi.createSection(pageId, {
                type: section.type,
                ordre: section.ordre,
                title: section.title,
                config: section.config,
                connecte_a: section.connecte_a || null,
              });
            } catch (secErr) {
              console.warn(`Section non créée pour la page ${pageId}:`, secErr);
            }
          }
        }
      }

      toast.success(`Le modèle "${template.name}" a été appliqué avec succès !`);
      navigate(`/app/editor/${projectId}`);
    } catch (err) {
      console.error("Erreur lors de l'application du modèle:", err);
      toast.alert(err.userMessage || "Impossible d'appliquer le modèle pour le moment.");
    } finally {
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4E9] font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-14 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C4622D]/10 border border-[#C4622D]/20 rounded-full text-[#C4622D] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Modèles Prêts à l'Emploi</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A0E0A] font-serif tracking-tight">
            Démarrez avec une base professionnelle
          </h1>
          <p className="text-[#7A5C44] text-lg max-w-2xl mx-auto">
            Sélectionnez une structure pré-configurée. L’assistant EnoC et l’éditeur visuel s’occupent d’adapter vos données.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            const isLoading = loadingTemplateId === tpl.id;

            return (
              <div 
                key={tpl.id} 
                className="bg-white rounded-2xl shadow-sm border border-[#E8D9C4] overflow-hidden hover:shadow-xl hover:border-[#C4622D]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header de la carte */}
                  <div className="p-6 bg-gradient-to-b from-[#FBF4E9]/50 to-white border-b border-[#E8D9C4]/50 flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#C4622D]/10 flex items-center justify-center text-[#C4622D]">
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                      {tpl.badge}
                    </span>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-[#C4622D] uppercase tracking-wider">
                        {tpl.category}
                      </span>
                      <h3 className="text-xl font-bold text-[#1A0E0A] font-serif mt-1">
                        {tpl.name}
                      </h3>
                    </div>

                    <p className="text-[#7A5C44] text-sm leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                        <Layers size={13} />
                        Sections & Fonctionnalités incluses :
                      </span>
                      <ul className="space-y-1.5">
                        {tpl.features.map((feat, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-6 pt-0">
                  <button 
                    onClick={() => handleApplyTemplate(tpl)}
                    disabled={isLoading || loadingTemplateId !== null}
                    className="w-full py-3.5 px-4 bg-[#C4622D] text-white rounded-xl font-bold text-sm hover:bg-[#A04E24] shadow-md shadow-[#C4622D]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Création du projet...</span>
                      </>
                    ) : (
                      <>
                        <span>Utiliser ce modèle</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

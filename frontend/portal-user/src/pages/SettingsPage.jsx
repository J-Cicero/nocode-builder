import React, { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../store/authStore";
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  Globe,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AICatalogManager from "../components/admin/AICatalogManager";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4E9] font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A0E0A] font-serif">
              Paramètres & Configuration
            </h1>
            <p className="text-[#7A5C44] text-sm sm:text-base mt-1">
              Gérez votre compte, votre sécurité et la palette dynamique des modèles d'IA.
            </p>
          </div>

          {/* Navigation par Onglets */}
          <div className="flex gap-2 border-b border-[#E8D9C4] pb-2">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === "account"
                  ? "bg-[#C4622D] text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-[#FBF4E9] border border-[#E8D9C4]"
              }`}
            >
              <User size={16} />
              <span>Mon Profil & Sécurité</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === "ai"
                  ? "bg-[#C4622D] text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-[#FBF4E9] border border-[#E8D9C4]"
              }`}
            >
              <Sparkles size={16} />
              <span>Modèles d'IA & Fournisseurs</span>
            </button>
          </div>
        </header>

        {activeTab === "ai" ? (
          <AICatalogManager />
        ) : (
          <div className="space-y-6">
            {/* Carte Profil */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8D9C4] space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C4622D]/10 flex items-center justify-center text-[#C4622D]">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#1A0E0A]">Profil Utilisateur</h2>
                <p className="text-xs text-[#7A5C44]">Informations enregistrées sur votre compte</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 size={13} />
              Actif
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Prénom & Nom
              </label>
              <div className="p-3.5 bg-[#FBF4E9]/50 border border-[#E8D9C4] rounded-xl text-sm font-semibold text-[#1A0E0A]">
                {user?.name || "—"} {user?.surname || ""}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={13} className="text-[#C4622D]" />
                Adresse Email
              </label>
              <div className="p-3.5 bg-[#FBF4E9]/50 border border-[#E8D9C4] rounded-xl text-sm font-semibold text-[#1A0E0A]">
                {user?.email || "non-renseigné"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={13} className="text-[#C4622D]" />
                Rôle Platform (IAM)
              </label>
              <div className="p-3.5 bg-[#FBF4E9]/50 border border-[#E8D9C4] rounded-xl text-sm font-semibold text-[#1A0E0A] uppercase tracking-wide">
                {user?.role || "user"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={13} className="text-[#C4622D]" />
                Langue par défaut
              </label>
              <div className="p-3.5 bg-[#FBF4E9]/50 border border-[#E8D9C4] rounded-xl text-sm font-semibold text-[#1A0E0A] uppercase">
                {user?.preferred_locale || "FR"}
              </div>
            </div>
          </div>
        </div>

        {/* Carte Sécurité */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8D9C4] space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#1A0E0A]">Sécurité & Session</h2>
              <p className="text-xs text-[#7A5C44]">Authentification centralisée IAM (svc-iam)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Déconnexion de la session</h3>
              <p className="text-xs text-gray-500">Termine votre session actuelle et efface les jetons d'accès locaux.</p>
            </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <LogOut size={14} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

    <Footer />
  </div>
);
}

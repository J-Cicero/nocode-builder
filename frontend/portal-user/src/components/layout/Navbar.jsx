import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/authStore";
import { ChevronDown, LogOut, User, Settings, Bell, Search, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/auth/login");
  };

  return (
    <nav className="h-16 bg-[#1A0E0A] sticky top-0 z-[100] px-5 flex items-center justify-between border-b border-white/5 shadow-xl" ref={menuRef}>
      {/* Brand */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer group" 
        onClick={() => navigate('/app/dashboard')}
      >
        <div className="w-9 h-9 bg-[#C4622D] rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
          E
        </div>
        <div className="hidden sm:block">
          <div className="font-serif text-xl text-[#D4A017] font-bold leading-none tracking-tight">
            EnoC
          </div>
          <div className="text-[9px] text-[#A08060] font-bold tracking-[0.2em] uppercase mt-0.5">
            Studio Africa
          </div>
        </div>
      </div>

      {/* Center Search / Nav */}
      <div className="hidden md:flex items-center gap-4">
        <Link 
          to="/templates" 
          className="text-[#D4A017] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Sparkles size={14} className="text-[#C4622D]" />
          <span>Modèles</span>
        </Link>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 w-72 focus-within:bg-white/10 focus-within:border-[#C4622D]/50 transition-all">
          <Search size={15} className="text-[#A08060]" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="bg-transparent border-none outline-none text-white text-xs px-2.5 w-full placeholder:text-[#A08060]/50"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 p-1 hover:bg-white/5 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#C4622D] text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white/5 group-hover:ring-[#C4622D]/30 transition-all">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-white text-xs font-bold leading-none mb-1">{user?.name || "User"}</div>
              <div className="text-[#D4A017] text-[9px] font-bold uppercase tracking-wider">
                {{
                  super_admin: "Super Admin",
                  admin: "Administrateur",
                  customer_service: "Support",
                  service_desk_l1: "Support L1",
                  user: "Créateur",
                }[user?.role] || "Utilisateur"}
              </div>
            </div>
            <ChevronDown size={14} className={`text-[#A08060] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#E8D9C4] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2.5 border-b border-[#FBF4E9] mb-1">
                <div className="text-[#1A0E0A] font-bold text-xs">{user?.name}</div>
                <div className="text-[#C4622D] text-[9px] uppercase font-bold tracking-wider mt-0.5">
                  Rôle : {{
                    super_admin: "Super Admin",
                    admin: "Administrateur",
                    customer_service: "Support",
                    service_desk_l1: "Support L1",
                    user: "Utilisateur",
                  }[user?.role] || "Utilisateur"}
                </div>
              </div>
              
              <Link to="/templates" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#1A0E0A] hover:bg-[#FBF4E9] hover:text-[#C4622D] transition-colors">
                <Sparkles size={14} className="text-[#C4622D]" />
                Modèles de projets
              </Link>
              <Link to="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#1A0E0A] hover:bg-[#FBF4E9] hover:text-[#C4622D] transition-colors">
                <User size={14} />
                Mon Profil
              </Link>
              <Link to="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#1A0E0A] hover:bg-[#FBF4E9] hover:text-[#C4622D] transition-colors">
                <Settings size={14} />
                Paramètres
              </Link>
              
              <div className="h-px bg-[#FBF4E9] my-1"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

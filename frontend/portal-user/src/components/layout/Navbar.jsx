import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/authStore";
import { ChevronDown, LogOut, User, Settings, Bell, Search } from "lucide-react";

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
    <nav className="h-20 bg-[#1A0E0A] sticky top-0 z-[100] px-6 flex items-center justify-between border-b border-white/5 shadow-xl" ref={menuRef}>
      {/* Brand */}
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => navigate('/app/dashboard')}
      >
        <div className="w-11 h-11 bg-[#C4622D] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform">
          E
        </div>
        <div className="hidden sm:block">
          <div className="font-serif text-2xl text-[#D4A017] font-bold leading-none tracking-tight">
            EnoC
          </div>
          <div className="text-[10px] text-[#A08060] font-bold tracking-[0.2em] uppercase mt-1">
            Studio Africa
          </div>
        </div>
      </div>

      {/* Center Search / Nav */}
      <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-96 focus-within:bg-white/10 focus-within:border-[#C4622D]/50 transition-all">
        <Search size={18} className="text-[#A08060]" />
        <input 
          type="text" 
          placeholder="Rechercher un projet, une page..." 
          className="bg-transparent border-none outline-none text-white text-sm px-3 w-full placeholder:text-[#A08060]/50"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-[#A08060] hover:text-white hover:bg-white/5 rounded-full transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#C4622D] rounded-full border-2 border-[#1A0E0A]"></span>
        </button>

        <div className="h-8 w-px bg-white/10 mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-2xl transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C4622D] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white/5 group-hover:ring-[#C4622D]/30 transition-all">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-white text-sm font-bold leading-none mb-1">{user?.name || "User"}</div>
              <div className="text-[#A08060] text-[10px] font-medium uppercase tracking-wider">Compte Pro</div>
            </div>
            <ChevronDown size={16} className={`text-[#A08060] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-[#E8D9C4] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[#FBF4E9] mb-1 lg:hidden">
                <div className="text-[#1A0E0A] font-bold text-sm">{user?.name}</div>
                <div className="text-[#7A5C44] text-[10px] uppercase font-bold tracking-wider mt-0.5">Compte Pro</div>
              </div>
              
              <Link to="/app/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A0E0A] hover:bg-[#FBF4E9] hover:text-[#C4622D] transition-colors">
                <User size={18} />
                Mon Profil
              </Link>
              <Link to="/app/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A0E0A] hover:bg-[#FBF4E9] hover:text-[#C4622D] transition-colors">
                <Settings size={18} />
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

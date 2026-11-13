import React from 'react';
import { Tv, Search, Users, CalendarCheck, Shield, BarChart3, LogOut, Briefcase, Palette } from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  leadsCount: number;
  scheduledCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  leadsCount,
  scheduledCount
}) => {
  const isAdmin = user.role === 'admin';
  const { theme, setThemeId } = useTheme();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-scm-badge.jpg"
              alt="SCM TECH"
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-wider">SCM TECH</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-600 text-white tracking-widest uppercase">
                  B2B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Hotéis • Hospitais • Grandes Bares</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('finder')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'finder'
                  ? theme.navActive
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Buscar Leads</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'portfolio'
                  ? theme.navActive
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Minha Carteira</span>
              {leadsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'portfolio' ? 'bg-black/25 text-inherit' : 'bg-slate-800 text-slate-300'
                }`}>
                  {leadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'agenda'
                  ? theme.navActive
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Visitas Agendadas</span>
              {scheduledCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {scheduledCount}
                </span>
              )}
            </button>

            {/* Abas exclusivas do Administrador */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    activeTab === 'users'
                      ? theme.navActive
                      : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gestão de Usuários</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ADM
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('supervisor')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    activeTab === 'supervisor'
                      ? theme.navActive
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Visão Geral Equipe</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile, Theme Selector & Logout */}
          <div className="flex items-center gap-3">
            {/* Seletor de Paleta / Tema */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setThemeId('cyan')}
                title="Paleta 1: Cyber Cyan (SCM TECH)"
                className={`w-3.5 h-3.5 rounded-full bg-cyan-400 transition cursor-pointer ${
                  theme.id === 'cyan' ? 'ring-2 ring-white scale-110 shadow-sm shadow-cyan-400' : 'opacity-50 hover:opacity-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setThemeId('royal')}
                title="Paleta 2: Royal Blue (Enterprise)"
                className={`w-3.5 h-3.5 rounded-full bg-blue-600 transition cursor-pointer ${
                  theme.id === 'royal' ? 'ring-2 ring-white scale-110 shadow-sm shadow-blue-500' : 'opacity-50 hover:opacity-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setThemeId('gold')}
                title="Paleta 3: Dark Onyx & Gold (VIP)"
                className={`w-3.5 h-3.5 rounded-full bg-amber-400 transition cursor-pointer ${
                  theme.id === 'gold' ? 'ring-2 ring-white scale-110 shadow-sm shadow-amber-400' : 'opacity-50 hover:opacity-100'
                }`}
              />
            </div>

            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Shield className="w-3 h-3" />
                    ADM
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    VENDEDOR
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">@{user.username}</span>
            </div>

            <button
              onClick={onLogout}
              title="Sair do Sistema"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('finder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'finder' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            Buscar Leads
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'portfolio' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            Minha Carteira ({leadsCount})
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'agenda' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            Visitas ({scheduledCount})
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'users' ? 'bg-amber-600 text-white' : 'text-amber-400'
                }`}
              >
                Usuários (Adm)
              </button>
              <button
                onClick={() => setActiveTab('supervisor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  activeTab === 'supervisor' ? 'bg-red-600 text-white' : 'text-slate-400'
                }`}
              >
                Visão Equipe
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

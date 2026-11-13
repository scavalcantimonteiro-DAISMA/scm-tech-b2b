import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'cyan' | 'royal' | 'gold';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primaryBg: string;
  primaryHover: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  highlightText: string;
  tagBg: string;
  tagText: string;
  ring: string;
  navActive: string;
  heroGradient: string;
  navbarBg: string;
  dotColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  gold: {
    id: 'gold',
    name: 'Champagne Gold & Onyx Suave (VIP)',
    description: 'Ouro Champanhe Suave & Grafite Titanium',
    primaryBg: 'bg-amber-500/90 hover:bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    badgeBg: 'bg-amber-400/10',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/25',
    highlightText: 'text-amber-400',
    tagBg: 'bg-amber-950/40',
    tagText: 'text-amber-200',
    ring: 'focus:ring-amber-400/50',
    navActive: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20',
    heroGradient: 'from-slate-950 via-zinc-900 to-slate-900',
    navbarBg: 'bg-slate-950/95',
    dotColor: '#e5b869'
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan (SCM TECH)',
    description: 'Ciano Elétrico & Slate Tecnológico',
    primaryBg: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-700',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    highlightText: 'text-cyan-500',
    tagBg: 'bg-cyan-50',
    tagText: 'text-cyan-900',
    ring: 'focus:ring-cyan-500',
    navActive: 'bg-cyan-600 text-white',
    heroGradient: 'from-slate-950 via-slate-900 to-cyan-950',
    navbarBg: 'bg-slate-950',
    dotColor: '#06b6d4'
  },
  royal: {
    id: 'royal',
    name: 'Royal Blue (Enterprise)',
    description: 'Azul Real Corporativo & Esmeralda',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    highlightText: 'text-blue-600',
    tagBg: 'bg-blue-50',
    tagText: 'text-blue-900',
    ring: 'focus:ring-blue-500',
    navActive: 'bg-blue-600 text-white',
    heroGradient: 'from-slate-900 via-slate-800 to-blue-950',
    navbarBg: 'bg-slate-900',
    dotColor: '#2563eb'
  }
};

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.gold,
  setThemeId: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('scm_theme_id');
    return (saved as ThemeId) || 'gold';
  });

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem('scm_theme_id', id);
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeId], setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

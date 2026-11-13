import React, { useState, useEffect } from 'react';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { LeadGenerator } from './components/LeadGenerator';
import { PortfolioView } from './components/PortfolioView';
import { VisitAgendaView } from './components/VisitAgendaView';
import { UserManagementView } from './components/UserManagementView';
import { SupervisorOverview } from './components/SupervisorOverview';
import { ScheduleModal } from './components/ScheduleModal';
import { NotesModal } from './components/NotesModal';
import { api } from './services/api';
import { Lead, User } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'finder' | 'portfolio' | 'agenda' | 'users' | 'supervisor'>('finder');

  // Contadores para os pills do Navbar
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  // Modais
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
      loadCounts(data.user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async (user: User) => {
    try {
      const stats = await api.getStats(user.role === 'admin' ? user.id : undefined);
      setLeadsCount(stats.total);
      setScheduledCount(stats.agendados);
    } catch (err) {
      console.error('Erro ao buscar contadores:', err);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('finder');
    loadCounts(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleRefresh = () => {
    if (currentUser) {
      loadCounts(currentUser);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-slate-300">Iniciando Sistema SKY B2B...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab: any) => setActiveTab(tab)}
        onLogout={handleLogout}
        leadsCount={leadsCount}
        scheduledCount={scheduledCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'finder' && (
          <LeadGenerator
            currentUser={currentUser}
            onLeadsImported={() => {
              handleRefresh();
              setActiveTab('portfolio');
            }}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            currentUser={currentUser}
            onLeadUpdated={handleRefresh}
            onRequestSchedule={(lead) => setSchedulingLead(lead)}
            onRequestNotes={(lead) => setNotesLead(lead)}
          />
        )}

        {activeTab === 'agenda' && (
          <VisitAgendaView
            currentUser={currentUser}
            onLeadUpdated={handleRefresh}
            onRequestSchedule={(lead) => setSchedulingLead(lead)}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UserManagementView currentUser={currentUser} />
        )}

        {activeTab === 'supervisor' && currentUser.role === 'admin' && (
          <SupervisorOverview
            onSelectUserToInspect={(_userId) => {
              setActiveTab('portfolio');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/assets/logo-scm-badge.jpg" alt="SCM TECH" className="w-5 h-5 rounded object-cover" />
            <span className="font-semibold text-slate-300">SCM TECH B2B Lead Master</span>
          </div>
          <p className="text-slate-400">
            Desenvolvido e criado pela <strong className="text-cyan-400 font-bold">SCM TECH</strong> • Todos os direitos reservados
          </p>
          <span className="text-[11px] text-slate-500 font-mono">v1.0 Corporativo</span>
        </div>
      </footer>

      {/* Modais Globais */}
      {schedulingLead && (
        <ScheduleModal
          lead={schedulingLead}
          onClose={() => setSchedulingLead(null)}
          onSuccess={() => {
            setSchedulingLead(null);
            handleRefresh();
          }}
        />
      )}

      {notesLead && (
        <NotesModal
          lead={notesLead}
          onClose={() => setNotesLead(null)}
          onSuccess={() => {
            setNotesLead(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default App;

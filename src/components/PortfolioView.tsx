import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  CalendarCheck, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Hotel, 
  UtensilsCrossed,
  Tv,
  Trash2,
  Users,
  Eye,
  StickyNote,
  Radio,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { DashboardStats, Lead, LeadStatus, User } from '../types';
import { LeadOutcomeModal } from './LeadOutcomeModal';

interface PortfolioViewProps {
  currentUser: User;
  onLeadUpdated: () => void;
  onRequestSchedule: (lead: Lead) => void;
  onRequestNotes: (lead: Lead) => void;
}

const STATUS_BADGES: Record<LeadStatus, { label: string; bg: string; text: string; border: string }> = {
  NOVO: { label: 'Novo (A Ligar)', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  CONTATO_REALIZADO: { label: '📞 Contato Realizado', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  TENTANDO: { label: 'Tentando Contato', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  NEGOCIACAO: { label: '🔵 Em Negociação', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  AGENDADO: { label: '🟢 Visita Agendada', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  JA_TEM_SKY: { label: '📡 Já tem SKY', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300' },
  OUTRA_OPERADORA: { label: '🏢 Outra Operadora', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  FECHADO: { label: '🏆 Fechado (Cliente SKY)', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
  SEM_INTERESSE: { label: '🔴 Sem Interesse', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' }
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  currentUser,
  onLeadUpdated,
  onRequestSchedule,
  onRequestNotes
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ramoFilter, setRamoFilter] = useState<string>('ALL');

  // Modal de desfecho comercial (contato, agendamento, operadora, fechamento)
  const [outcomeModalLead, setOutcomeModalLead] = useState<Lead | null>(null);

  // Controle de Supervisor para Adm
  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      loadTeamUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    loadPortfolioData();
  }, [targetUserId, statusFilter, ramoFilter, searchTerm]);

  const loadTeamUsers = async () => {
    try {
      const users = await api.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    }
  };

  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      const target = currentUser.role === 'admin' ? targetUserId : currentUser.id;
      const [leadsData, statsData] = await Promise.all([
        api.getLeads({
          status: statusFilter,
          ramo: ramoFilter,
          search: searchTerm,
          targetUserId: target
        }),
        api.getStats(target)
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar carteira:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    if (newStatus === 'AGENDADO' || newStatus === 'OUTRA_OPERADORA' || newStatus === 'JA_TEM_SKY' || newStatus === 'FECHADO' || newStatus === 'CONTATO_REALIZADO') {
      setOutcomeModalLead(lead);
      return;
    }

    try {
      await api.updateLeadStatus(lead.id, { status: newStatus });
      loadPortfolioData();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Tem certeza que deseja remover "${lead.tradeName}" da sua carteira?`)) {
      return;
    }
    try {
      await api.deleteLead(lead.id);
      loadPortfolioData();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir lead');
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const cleanPhone = lead.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá, tudo bem? Sou ${currentUser.name} da equipe corporativa da SKY Brasil / SCM TECH.\n\n` +
      `Entro em contato com o ${lead.tradeName} a respeito das soluções corporativas de TV em HD e conectividade para ${lead.ramoLabel}.\n\n` +
      `Gostaria de falar com o responsável (${lead.contactPerson}) para apresentar uma proposta de redução de custos com pacotes oficiais SKY.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openMaps = (lead: Lead) => {
    const query = encodeURIComponent(`${lead.tradeName}, ${lead.street}, ${lead.number}, ${lead.city} - ${lead.state}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const exportToExcel = () => {
    const rows = leads.map(l => ({
      'Nome Fantasia': l.tradeName,
      'Razão Social': l.companyName,
      'Ramo': l.ramoLabel,
      'Status': STATUS_BADGES[l.status]?.label || l.status,
      'Operadora Atual': l.currentOperator || (l.status === 'JA_TEM_SKY' ? 'SKY Brasil' : 'Não informada'),
      'Telefone Fixo': l.phone,
      'WhatsApp': l.whatsapp,
      'E-mail': l.email,
      'Endereço': `${l.street}, ${l.number} - ${l.neighborhood}`,
      'Cidade': l.city,
      'Estado': l.state,
      'CEP': l.cep,
      'CNPJ': l.cnpj,
      'Estimativa de Telas': l.estimatedScreens,
      'Decisor': l.contactPerson,
      'Total Ligações Feitas': l.callCount || 0,
      'Data da Visita': l.visitDate ? new Date(l.visitDate).toLocaleString('pt-BR') : 'Não agendada',
      'Observações da Visita': l.visitNotes || '',
      'Vendedor Responsável': l.userName || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads SKY B2B');
    XLSX.writeFile(workbook, `Carteira_SKY_B2B_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Carteira</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">A Ligar / Novos</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.novos}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Contatos Feitos</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{(stats.contatoRealizado || 0) + (stats.negociacao || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Visitas Agendadas</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.agendados}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Clientes Fechados</span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">{stats.fechados}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">Já tem SKY / Outra</span>
            <span className="text-2xl font-black text-orange-600 mt-1 block">{(stats.jaTemSky || 0) + (stats.outraOperadora || 0)}</span>
          </div>
        </div>
      )}

      {/* Main Filter & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Supervisor Filter for Adm */}
        {currentUser.role === 'admin' && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Controle de Visualização do Administrador:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-800 font-medium">Exibindo carteira de:</span>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-3 py-1 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={currentUser.id}>Minha Própria Carteira (Adm)</option>
                <option value="all">🌐 Toda a Equipe (Todos os Usuários)</option>
                {allUsers
                  .filter(u => u.id !== currentUser.id)
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      👤 Vendedor: {u.name} (@{u.username})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Search & Selectors */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CNPJ, bairro ou telefone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Ramo Filter */}
            <select
              value={ramoFilter}
              onChange={(e) => setRamoFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Todos os Ramos</option>
              <option value="hoteis">🏨 Hotéis & Pousadas</option>
              <option value="hospitais">🏥 Hospitais & Clínicas</option>
              <option value="bares_restaurantes">🍽️ Bares & Restaurantes</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="NOVO">⚪ Novo (A Ligar)</option>
              <option value="CONTATO_REALIZADO">📞 Contato Realizado</option>
              <option value="AGENDADO">🟢 Visita Agendada</option>
              <option value="JA_TEM_SKY">📡 Já tem SKY</option>
              <option value="OUTRA_OPERADORA">🏢 Já tem Outra Operadora</option>
              <option value="NEGOCIACAO">🔵 Em Negociação</option>
              <option value="FECHADO">🏆 Fechado (Cliente SKY)</option>
              <option value="SEM_INTERESSE">🔴 Sem Interesse</option>
            </select>

            {/* Exportar Excel */}
            <button
              type="button"
              onClick={exportToExcel}
              disabled={leads.length === 0}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Carregando carteira de leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum estabelecimento encontrado nesta carteira</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use a aba <strong>"Buscar Leads"</strong> acima para selecionar o ramo e o estado e minerar os contatos para sua lista!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const statusConfig = STATUS_BADGES[lead.status] || STATUS_BADGES.NOVO;
            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações Principais */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-lg">
                        {lead.tradeName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>

                      {/* Operadora Atual (se preenchida) */}
                      {lead.currentOperator && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
                          Operadora: {lead.currentOperator}
                        </span>
                      )}

                      {/* Visita Agendada */}
                      {lead.status === 'AGENDADO' && lead.visitDate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          Visita: {new Date(lead.visitDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-mono">
                      {lead.companyName} • CNPJ: {lead.cnpj}
                    </p>

                    {/* Endereço & Estimativa */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-50/90 border border-amber-200/60 px-2 py-0.5 rounded">
                        <Tv className="w-3.5 h-3.5 text-amber-600" />
                        {lead.estimatedScreens}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>Decisor: <strong>{lead.contactPerson}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {lead.street}, {lead.number} - {lead.neighborhood}, {lead.city}/{lead.state}
                      </span>
                    </div>

                    {/* Contador de Ligações & Histórico */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                      <span>Tentativas de Ligação: <strong>{lead.callCount || 0}</strong></span>
                      {lead.lastCallAt && (
                        <span>• Última em: {new Date(lead.lastCallAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      )}
                      {lead.notes && lead.notes.length > 0 && (
                        <span className="text-amber-800 font-medium">
                          • {lead.notes.length} anotação(ões) registrada(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações Comerciais Imediatas */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Botão Principal: Registrar Contato / Desfecho (SUPER DESTAQUE) */}
                    <button
                      type="button"
                      onClick={() => setOutcomeModalLead(lead)}
                      title="Registrar se falou com o cliente, agendou visita, operadora atual ou fechamento"
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Registrar Contato / Desfecho</span>
                    </button>

                    {/* Botão Ligar no Telefone Fixo */}
                    <a
                      href={`tel:${lead.phone.replace(/\D/g, '')}`}
                      title={`Ligar para ${lead.phone}`}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{lead.phone}</span>
                    </a>

                    {/* Botão WhatsApp */}
                    <button
                      type="button"
                      onClick={() => openWhatsApp(lead)}
                      title="Abrir WhatsApp com Proposta Comercial"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Botão Maps */}
                    <button
                      type="button"
                      onClick={() => openMaps(lead)}
                      title="Ver Rota no Google Maps"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    {/* Botão Anotações */}
                    <button
                      type="button"
                      onClick={() => onRequestNotes(lead)}
                      title="Ver e Adicionar Anotações"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition cursor-pointer"
                    >
                      <StickyNote className="w-4 h-4" />
                    </button>

                    {/* Seletor Rápido de Status */}
                    <select
                      value={lead.status}
                      onChange={(e) => handleQuickStatusChange(lead, e.target.value as LeadStatus)}
                      className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="NOVO">⚪ Novo</option>
                      <option value="CONTATO_REALIZADO">📞 Contato Realizado</option>
                      <option value="AGENDADO">🟢 Agendar Visita</option>
                      <option value="JA_TEM_SKY">📡 Já tem SKY</option>
                      <option value="OUTRA_OPERADORA">🏢 Outra Operadora</option>
                      <option value="NEGOCIACAO">🔵 Em Negociação</option>
                      <option value="FECHADO">🏆 Fechado (Cliente)</option>
                      <option value="SEM_INTERESSE">🔴 Sem Interesse</option>
                    </select>

                    {/* Excluir da Carteira */}
                    <button
                      type="button"
                      onClick={() => handleDelete(lead)}
                      title="Remover da Minha Carteira"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Desfecho Comercial */}
      {outcomeModalLead && (
        <LeadOutcomeModal
          lead={outcomeModalLead}
          onClose={() => setOutcomeModalLead(null)}
          onSuccess={() => {
            setOutcomeModalLead(null);
            loadPortfolioData();
            onLeadUpdated();
          }}
        />
      )}
    </div>
  );
};

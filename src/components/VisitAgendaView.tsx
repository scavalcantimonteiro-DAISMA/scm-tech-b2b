import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  CalendarCheck,
  Building2,
  Tv,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, User } from '../types';

interface VisitAgendaViewProps {
  currentUser: User;
  onLeadUpdated: () => void;
  onRequestSchedule: (lead: Lead) => void;
}

export const VisitAgendaView: React.FC<VisitAgendaViewProps> = ({
  currentUser,
  onLeadUpdated,
  onRequestSchedule
}) => {
  const [scheduledLeads, setScheduledLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisits();
  }, [currentUser]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({
        status: 'AGENDADO',
        targetUserId: currentUser.role === 'admin' ? 'all' : currentUser.id
      });
      // Ordena por data da visita
      data.sort((a, b) => {
        if (!a.visitDate) return 1;
        if (!b.visitDate) return -1;
        return new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime();
      });
      setScheduledLeads(data);
    } catch (err) {
      console.error('Erro ao carregar visitas agendadas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClosed = async (lead: Lead) => {
    try {
      await api.updateLeadStatus(lead.id, {
        status: 'FECHADO',
        note: '🎉 Venda concretizada! Contrato SKY B2B fechado durante a visita.'
      });
      loadVisits();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao fechar visita');
    }
  };

  const handleMarkLost = async (lead: Lead) => {
    const reason = prompt('Informe o motivo caso não tenha interesse (ex: já tem contrato vigente com outra operadora):');
    try {
      await api.updateLeadStatus(lead.id, {
        status: 'SEM_INTERESSE',
        note: reason ? `Visita realizada: ${reason}` : 'Visita realizada: sem interesse no momento.'
      });
      loadVisits();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar');
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const cleanPhone = lead.whatsapp.replace(/\D/g, '');
    const dateFormatted = lead.visitDate ? new Date(lead.visitDate).toLocaleString('pt-BR') : '';
    const message = encodeURIComponent(
      `Olá ${lead.contactPerson}, tudo bem? Sou ${currentUser.name} da SKY B2B.\n\n` +
      `Estou confirmando nossa visita técnica agendada para o dia ${dateFormatted} no ${lead.tradeName}.\n\n` +
      `Nos vemos em breve!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openMaps = (lead: Lead) => {
    const query = encodeURIComponent(`${lead.tradeName}, ${lead.street}, ${lead.number}, ${lead.city} - ${lead.state}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            Visitas Presenciais & Reuniões
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Agenda de Visitas Comerciais • SCM TECH
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Organize seu roteiro presencial em hotéis, hospitais e restaurantes para fechar contratos de telas.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-center shrink-0">
          <span className="text-xs font-bold text-emerald-800 uppercase block">Total de Visitas</span>
          <span className="text-2xl font-black text-emerald-700 block mt-0.5">{scheduledLeads.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Carregando compromissos agendados...</p>
        </div>
      ) : scheduledLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma visita agendada no momento</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Quando você ligar para os estabelecimentos na sua carteira e o cliente aceitar a reunião, marque o status como <strong>"Agendar Visita"</strong>!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduledLeads.map((lead) => {
            const dateObj = lead.visitDate ? new Date(lead.visitDate) : null;
            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge: Date & Time */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>
                        {dateObj
                          ? dateObj.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
                          : 'Data a definir'}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {lead.ramoLabel}
                    </span>
                  </div>

                  {/* Nome da Empresa */}
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {lead.tradeName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    CNPJ: {lead.cnpj}
                  </p>

                  {/* Decisor & Potencial */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <p>
                      <strong className="text-slate-800">Decisor da Reunião:</strong> {lead.contactPerson}
                    </p>
                    <p>
                      <strong className="text-slate-800">Potencial Estimado:</strong> {lead.estimatedScreens}
                    </p>
                    {lead.visitNotes && (
                      <p className="text-emerald-900 font-medium pt-1 border-t border-slate-200">
                        <strong>Obs do Agendamento:</strong> {lead.visitNotes}
                      </p>
                    )}
                    {currentUser.role === 'admin' && lead.userName && (
                      <p className="text-slate-400 text-[11px] pt-1">
                        Responsável: <strong>{lead.userName}</strong>
                      </p>
                    )}
                  </div>

                  {/* Endereço */}
                  <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      {lead.street}, {lead.number} - {lead.neighborhood}, {lead.city} - {lead.state}
                    </span>
                  </div>
                </div>

                {/* Ações da Visita */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openMaps(lead)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ver Rota</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(lead)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Confirmar Whats</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestSchedule(lead)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <span>Reagendar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMarkClosed(lead)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Fechou Contrato</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkLost(lead)}
                      title="Marcar como sem interesse"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  CalendarCheck, 
  Tv, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Clock, 
  User as UserIcon,
  Sparkles,
  Radio,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, LeadStatus } from '../types';

interface LeadOutcomeModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOMES: {
  status: LeadStatus;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  border: string;
  activeBg: string;
}[] = [
  {
    status: 'CONTATO_REALIZADO',
    title: 'Entrou em Contato / Ligou',
    subtitle: 'Conversou com o decisor, apresentou o portfólio inicial',
    icon: PhoneCall,
    color: 'text-amber-600',
    border: 'border-amber-300',
    activeBg: 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
  },
  {
    status: 'AGENDADO',
    title: 'Agendou Visita Presencial',
    subtitle: 'Data marcada no local para vistoria e fechamento',
    icon: CalendarCheck,
    color: 'text-emerald-600',
    border: 'border-emerald-300',
    activeBg: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
  },
  {
    status: 'JA_TEM_SKY',
    title: 'Já tem SKY (Base Ativa)',
    subtitle: 'Cliente já utiliza antena/solução corporativa da SKY',
    icon: Radio,
    color: 'text-sky-600',
    border: 'border-sky-300',
    activeBg: 'bg-sky-50 border-sky-500 ring-2 ring-sky-400'
  },
  {
    status: 'OUTRA_OPERADORA',
    title: 'Já tem Outra Operadora',
    subtitle: 'Utiliza Claro, Vivo, Oi ou provedor regional',
    icon: Building2,
    color: 'text-orange-600',
    border: 'border-orange-300',
    activeBg: 'bg-orange-50 border-orange-500 ring-2 ring-orange-400'
  },
  {
    status: 'NEGOCIACAO',
    title: 'Em Negociação / Proposta',
    subtitle: 'Proposta formal enviada, aguardando aprovação',
    icon: FileText,
    color: 'text-blue-600',
    border: 'border-blue-300',
    activeBg: 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
  },
  {
    status: 'FECHADO',
    title: 'Aceitou e Fechou o Plano! 🏆',
    subtitle: 'Contrato corporativo SKY fechado com sucesso!',
    icon: Sparkles,
    color: 'text-purple-600',
    border: 'border-purple-300',
    activeBg: 'bg-purple-50 border-purple-500 ring-2 ring-purple-400'
  },
  {
    status: 'SEM_INTERESSE',
    title: 'Sem Interesse / Recusou',
    subtitle: 'Decisor recusou proposta ou não utiliza TVs',
    icon: XCircle,
    color: 'text-rose-600',
    border: 'border-rose-300',
    activeBg: 'bg-rose-50 border-rose-500 ring-2 ring-rose-400'
  }
];

export const LeadOutcomeModal: React.FC<LeadOutcomeModalProps> = ({ lead, onClose, onSuccess }) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(
    lead.status === 'NOVO' ? 'CONTATO_REALIZADO' : lead.status
  );

  // Visita
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };
  const [visitDate, setVisitDate] = useState(lead.visitDate ? lead.visitDate.slice(0, 16) : getDefaultDateTime());
  const [contactPerson, setContactPerson] = useState(lead.contactPerson || '');
  const [visitNotes, setVisitNotes] = useState(lead.visitNotes || '');

  // Operadora concorrente
  const [competitorOperator, setCompetitorOperator] = useState<string>(
    lead.currentOperator && lead.currentOperator !== 'SKY Brasil' ? lead.currentOperator : 'Claro / NET'
  );
  const [customOperator, setCustomOperator] = useState('');

  // Fechado
  const [closedScreens, setClosedScreens] = useState<string>(lead.screensCount ? String(lead.screensCount) : '10');
  const [closedPlan, setClosedPlan] = useState<string>('SKY B2B Corporativo HD');

  // Nota de histórico geral
  const [callNotes, setCallNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalOperator: string | null = null;
      let finalNote = callNotes.trim();

      if (selectedStatus === 'JA_TEM_SKY') {
        finalOperator = 'SKY Brasil';
        finalNote = finalNote 
          ? `[Já tem SKY]: ${finalNote}` 
          : `Cliente informado como usuário ativo da SKY no estabelecimento.`;
      } else if (selectedStatus === 'OUTRA_OPERADORA') {
        finalOperator = competitorOperator === 'Outra' ? (customOperator || 'Outra Concorrente') : competitorOperator;
        finalNote = finalNote 
          ? `[Concorrente - ${finalOperator}]: ${finalNote}` 
          : `Cliente utiliza operadora ${finalOperator}.`;
      } else if (selectedStatus === 'AGENDADO') {
        finalNote = finalNote 
          ? `[Visita Agendada]: ${finalNote}` 
          : `Visita marcada para ${new Date(visitDate).toLocaleString('pt-BR')} com ${contactPerson}.`;
      } else if (selectedStatus === 'FECHADO') {
        finalOperator = 'SKY Brasil';
        finalNote = finalNote 
          ? `[🏆 CONTRATO FECHADO]: Plano ${closedPlan} com ${closedScreens} pontos/telas. Obs: ${finalNote}` 
          : `🏆 CONTRATO FECHADO: Plano ${closedPlan} com ${closedScreens} pontos/telas!`;
      } else if (selectedStatus === 'CONTATO_REALIZADO') {
        finalNote = finalNote 
          ? `[Contato Realizado]: ${finalNote}` 
          : `Contato realizado com ${contactPerson || 'o responsável'}.`;
      }

      await api.updateLeadStatus(lead.id, {
        status: selectedStatus,
        currentOperator: finalOperator,
        visitDate: selectedStatus === 'AGENDADO' ? visitDate : undefined,
        visitNotes: selectedStatus === 'AGENDADO' ? visitNotes : undefined,
        note: finalNote
      });

      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar desfecho do lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-start justify-between shrink-0 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                Retorno Comercial
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {lead.ramoLabel} • {lead.city}/{lead.state}
              </span>
            </div>
            <h3 className="font-extrabold text-xl text-white mt-1 leading-tight">
              {lead.tradeName}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Decisor: <strong className="text-amber-300">{lead.contactPerson || 'Gerente / Proprietário'}</strong> • {lead.estimatedScreens}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Seletor Visual de Desfecho Comercial */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Qual foi o resultado do contato com o cliente?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OUTCOMES.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedStatus === item.status;
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => setSelectedStatus(item.status)}
                    className={`text-left p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? item.activeBg
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white shadow-xs shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {item.title}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-1"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos Dinâmicos conforme a seleção */}

          {/* 1. AGENDOU VISITA */}
          {selectedStatus === 'AGENDADO' && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>Dados do Agendamento Presencial</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Data e Hora da Visita *
                  </label>
                  <input
                    type="datetime-local"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome de quem vai receber
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ex: Sr. Marcos (Gerente)"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações para a Visita Técnica/Comercial
                </label>
                <input
                  type="text"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Ex: Levar proposta impressa para 25 TVs nos quartos e recepção"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* 2. JÁ TEM OUTRA OPERADORA */}
          {selectedStatus === 'OUTRA_OPERADORA' && (
            <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 space-y-3">
              <div className="flex items-center gap-2 text-orange-800 font-bold text-xs">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span>Qual operadora o cliente possui atualmente?</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Claro / NET', 'Vivo Empresas', 'Oi TV / Telecom', 'Outra'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setCompetitorOperator(op)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition cursor-pointer ${
                      competitorOperator === op
                        ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-100/50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {competitorOperator === 'Outra' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da operadora ou provedor
                  </label>
                  <input
                    type="text"
                    value={customOperator}
                    onChange={(e) => setCustomOperator(e.target.value)}
                    placeholder="Ex: Provedor Local Fibra, TV Antena Coletiva..."
                    className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. JÁ TEM SKY */}
          {selectedStatus === 'JA_TEM_SKY' && (
            <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Radio className="w-4 h-4 text-sky-600" />
                <span>Cliente Base Ativa SKY</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                O cliente será marcado como já atendido pela SKY Brasil. Você pode anotar abaixo se há oportunidade futura de renovação ou pontos adicionais.
              </p>
            </div>
          )}

          {/* 4. FECHADO / CONTRATO ACEITO */}
          {selectedStatus === 'FECHADO' && (
            <div className="p-4 rounded-xl bg-purple-50/90 border border-purple-200 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Parabéns! Registrar Fechamento SKY B2B</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Plano SKY Contratado
                  </label>
                  <input
                    type="text"
                    value={closedPlan}
                    onChange={(e) => setClosedPlan(e.target.value)}
                    placeholder="Ex: SKY B2B Hospedagem HD 30 Canais"
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quantidade de Pontos/Telas Fechadas
                  </label>
                  <input
                    type="number"
                    value={closedScreens}
                    onChange={(e) => setClosedScreens(e.target.value)}
                    placeholder="Ex: 24"
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo da Conversa / Anotação Geral */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Anotação / Resumo do que o cliente falou
            </label>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Ex: Falei com o Carlos. Disse que o contrato atual vence em 3 meses e aceitou receber proposta comparativa para 30 telas..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Salvar e Atualizar Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

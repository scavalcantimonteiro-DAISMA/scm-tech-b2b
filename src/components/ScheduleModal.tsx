import React, { useState } from 'react';
import { CalendarCheck, X, Clock, User, FileText, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { Lead } from '../types';

interface ScheduleModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ lead, onClose, onSuccess }) => {
  // Define data padrão para amanhã às 14:00
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const [visitDate, setVisitDate] = useState(lead.visitDate ? lead.visitDate.slice(0, 16) : getDefaultDateTime());
  const [contactPerson, setContactPerson] = useState(lead.contactPerson || '');
  const [visitNotes, setVisitNotes] = useState(lead.visitNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateLeadStatus(lead.id, {
        status: 'AGENDADO',
        visitDate,
        visitNotes,
        note: `📅 Visita presencial agendada para ${new Date(visitDate).toLocaleString('pt-BR')} com ${contactPerson}. Obs: ${visitNotes || 'Sem observações adicionais.'}`
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao agendar visita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Agendar Visita Comercial</h3>
              <p className="text-xs text-emerald-100">SCM TECH • Apresentação Presencial</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Info */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
          <p className="font-bold text-slate-800 text-sm">{lead.tradeName}</p>
          <div className="flex items-center gap-1 text-slate-500 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{lead.street}, {lead.number} - {lead.neighborhood}, {lead.city}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Data e Horário da Visita:</span>
            </label>
            <input
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Pessoa de Contato / Decisor:</span>
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Ex: Carlos (Gerente Geral) ou Roberta (Compras)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Observações / Recomendações para a Visita:</span>
            </label>
            <textarea
              rows={3}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              placeholder="Ex: Cliente tem 60 quartos e quer canais Premier/SporTV. Levar amostra de comodato e tabela corporativa."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  <span>Confirmar Visita</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

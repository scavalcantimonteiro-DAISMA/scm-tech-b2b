import React, { useState } from 'react';
import { StickyNote, X, Send, Clock, User, Phone } from 'lucide-react';
import { api } from '../services/api';
import { Lead } from '../types';

interface NotesModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ lead, onClose, onSuccess }) => {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSaving(true);
    try {
      await api.addNote(lead.id, noteText);
      setNoteText('');
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar anotação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Histórico de Contatos & Anotações</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{lead.tradeName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Notes List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          {(!lead.notes || lead.notes.length === 0) ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Nenhuma anotação registrada ainda para este estabelecimento.
            </div>
          ) : (
            lead.notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-sm space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-700">{note.userName}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(note.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-slate-800 font-medium whitespace-pre-wrap">{note.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Form to add note */}
        <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Digite o resumo da ligação ou observação..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !noteText.trim()}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

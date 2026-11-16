import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Tv, 
  User as UserIcon, 
  Check, 
  FileText,
  Save,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { Lead } from '../types';

interface EditLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
  onSaveLead?: (updatedLead: Partial<Lead>) => Promise<void> | void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ lead, onClose, onSuccess, onSaveLead }) => {
  const [tradeName, setTradeName] = useState(lead.tradeName || '');
  const [companyName, setCompanyName] = useState(lead.companyName || '');
  const [contactPerson, setContactPerson] = useState(lead.contactPerson || '');
  const [whatsapp, setWhatsapp] = useState(lead.whatsapp || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [email, setEmail] = useState(lead.email || '');
  const [website, setWebsite] = useState(lead.website || '');
  const [street, setStreet] = useState(lead.street || '');
  const [number, setNumber] = useState(lead.number || '');
  const [neighborhood, setNeighborhood] = useState(lead.neighborhood || '');
  const [city, setCity] = useState(lead.city || '');
  const [state, setState] = useState(lead.state || '');
  const [cep, setCep] = useState(lead.cep || '');
  const [cnpj, setCnpj] = useState(lead.cnpj || '');
  const [estimatedScreens, setEstimatedScreens] = useState(lead.estimatedScreens || '');
  const [currentOperator, setCurrentOperator] = useState(lead.currentOperator || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      setError('O Nome Fantasia é obrigatório.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedFields: Partial<Lead> = {
        tradeName: tradeName.trim(),
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        whatsapp: whatsapp.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        cep: cep.trim(),
        cnpj: cnpj.trim(),
        estimatedScreens: estimatedScreens.trim(),
        currentOperator: currentOperator.trim() || null
      };

      if (onSaveLead) {
        await onSaveLead(updatedFields);
      } else {
        await api.updateLead(lead.id, updatedFields);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados do contato.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-start justify-between shrink-0 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Editar Contato & WhatsApp
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {lead.ramoLabel} • {lead.city}/{lead.state}
              </span>
            </div>
            <h3 className="font-extrabold text-xl text-white mt-1 leading-tight">
              {lead.tradeName}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Atualize telefones reais, WhatsApp do decisor e informações comerciais
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Destaque WhatsApp & Telefone */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Contatos Diretos (WhatsApp & Telefone Fixo)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1">
                  <span>WhatsApp do Decisor:</span>
                  <span className="text-[10px] text-emerald-700 font-normal">(abre no wa.me)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-emerald-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Insira DDD + 9 dígitos (ex: 11988887777 ou (11) 98888-7777)
                </p>
              </div>

              {/* Telefone Fixo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone Comercial / Fixo:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3333-4444"
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Pessoa Decisora */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Decisor / Responsável:
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ex: Carlos Mendes (Gerente Geral / Compras)"
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Dados do Estabelecimento */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia:
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CNPJ:
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimativa de Telas / Quartos:
                </label>
                <div className="relative">
                  <Tv className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={estimatedScreens}
                    onChange={(e) => setEstimatedScreens(e.target.value)}
                    placeholder="Ex: 85 quartos/telas"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operadora Atual:
                </label>
                <input
                  type="text"
                  value={currentOperator}
                  onChange={(e) => setCurrentOperator(e.target.value)}
                  placeholder="Claro, Vivo, SKY, etc."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Comercial:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website / Link:
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Endereço Completo:
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                <div className="col-span-2 sm:col-span-3">
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua / Avenida"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Número"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF (ex: SP)"
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

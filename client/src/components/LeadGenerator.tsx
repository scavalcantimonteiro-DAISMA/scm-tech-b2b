import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Hotel, 
  UtensilsCrossed, 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckSquare, 
  Square, 
  PlusCircle, 
  ExternalLink, 
  Tv, 
  Sparkles,
  Users,
  Check,
  Edit3,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Lead, RamoConfig, StateConfig, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EditLeadModal } from './EditLeadModal';

interface LeadGeneratorProps {
  currentUser: User;
  onLeadsImported: () => void;
}

export const LeadGenerator: React.FC<LeadGeneratorProps> = ({ currentUser, onLeadsImported }) => {
  const { theme } = useTheme();
  const [states, setStates] = useState<StateConfig[]>([]);
  const [selectedRamo, setSelectedRamo] = useState<'hoteis' | 'hospitais' | 'bares_restaurantes'>('hoteis');
  const [selectedState, setSelectedState] = useState<string>('SP');
  const [selectedCity, setSelectedCity] = useState<string>('São Paulo');
  const [leadCount, setLeadCount] = useState<number>(500);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal de edição de lead na prévia
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Importação de planilha Excel
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [importingExcel, setImportingExcel] = useState(false);

  // Paginação e filtro interno dos resultados
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [resultFilter, setResultFilter] = useState<string>('');

  // Para Adm: opção de atribuir para outro usuário
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>(currentUser.id);

  useEffect(() => {
    loadMeta();
    if (currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadMeta = async () => {
    try {
      const meta = await api.getSearchMeta();
      setStates(meta.states);
      if (meta.states.length > 0) {
        setSelectedState(meta.states[0].uf);
        setSelectedCity(meta.states[0].cities[0] || '');
      }
    } catch (err) {
      console.error('Erro ao carregar estados:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await api.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleStateChange = (uf: string) => {
    setSelectedState(uf);
    const found = states.find(s => s.uf === uf);
    if (found && found.cities.length > 0) {
      setSelectedCity(found.cities[0]);
    } else {
      setSelectedCity('');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    setSelectedLeadIds(new Set());
    setCurrentPage(1);
    setResultFilter('');

    try {
      const res = await api.searchLeads(selectedRamo, selectedState, selectedCity, leadCount, searchKeyword);
      setSearchResults(res.leads);
      // Seleciona todos por padrão para facilitar a importação
      const allIds = new Set(res.leads.map(l => l.id));
      setSelectedLeadIds(allIds);
      if (res.leads.length === 0) {
        setFeedbackMessage('Nenhum resultado encontrado para os filtros selecionados.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao minerar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingExcel(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (!rawData || rawData.length === 0) {
          alert('A planilha selecionada está vazia ou não possui linhas válidas.');
          setImportingExcel(false);
          return;
        }

        const parsedLeads: Partial<Lead>[] = rawData.map((row, idx) => {
          const findVal = (keys: string[]) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              if (keys.some(target => cleanK.includes(target))) {
                const val = row[k];
                return val !== undefined && val !== null ? String(val).trim() : '';
              }
            }
            return '';
          };

          const tradeName = findVal(['fantasia', 'nome', 'empresa', 'cliente', 'estabelecimento', 'razao']) || `Estabelecimento Importado ${idx + 1}`;
          const companyName = findVal(['razao', 'social', 'empresa']) || tradeName;
          const phone = findVal(['fixo', 'telefone', 'tel', 'fone', 'comercial']) || '(11) 3000-0000';
          const whatsapp = findVal(['whatsapp', 'whats', 'zap', 'celular', 'cel', 'movel']) || phone;
          const contactPerson = findVal(['contato', 'decisor', 'responsavel', 'gerente', 'socio', 'comprador', 'diretor']) || 'Gerente / Proprietário';
          const street = findVal(['rua', 'endereco', 'logradouro', 'av', 'avenida']) || 'Av. Principal';
          const number = findVal(['numero', 'num', 'n']) || 'S/N';
          const neighborhood = findVal(['bairro', 'distrito']) || 'Centro';
          const city = findVal(['cidade', 'municipio']) || 'São Paulo';
          const state = findVal(['estado', 'uf']) || 'SP';
          const cep = findVal(['cep']) || '00000-000';
          const cnpj = findVal(['cnpj', 'documento']) || `${String(idx + 10).padStart(2, '0')}.123.456/0001-00`;
          const screens = findVal(['telas', 'quartos', 'pontos', 'leitos', 'tvs']) || '25 telas/quartos';
          const ramoText = findVal(['ramo', 'categoria', 'tipo', 'segmento']).toLowerCase();
          
          let ramo: 'hoteis' | 'hospitais' | 'bares_restaurantes' = 'hoteis';
          let ramoLabel = 'Hotelaria & Pousadas';
          if (ramoText.includes('hosp') || ramoText.includes('saude') || ramoText.includes('clin') || ramoText.includes('medic')) {
            ramo = 'hospitais';
            ramoLabel = 'Hospitais & Clínicas';
          } else if (ramoText.includes('bar') || ramoText.includes('rest') || ramoText.includes('choper') || ramoText.includes('aliment') || ramoText.includes('gastronom')) {
            ramo = 'bares_restaurantes';
            ramoLabel = 'Bares & Restaurantes';
          }

          return {
            id: `lead_excel_${Date.now()}_${idx}`,
            ramo,
            ramoLabel,
            tradeName,
            companyName,
            cnpj,
            phone,
            whatsapp,
            email: findVal(['email', 'e-mail', 'mail']) || `comercial@${tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
            website: findVal(['site', 'web', 'link']) || '',
            street,
            number,
            neighborhood,
            city,
            state: state.slice(0, 2).toUpperCase(),
            cep,
            estimatedScreens: screens,
            screensCount: parseInt(screens.replace(/\D/g, ''), 10) || 25,
            contactPerson,
            skySolution: 'Soluções Corporativas SKY B2B em Alta Definição',
            cnae: '5510-8/01 - Atividades Hoteleiras e Similares',
            status: 'NOVO',
            visitDate: null,
            visitNotes: null,
            callCount: 0,
            lastCallAt: null,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Lead;
        });

        // Coloca na prévia para o usuário ver antes de importar ou salva direto se preferir
        setSearchResults(parsedLeads as Lead[]);
        setSelectedLeadIds(new Set((parsedLeads as Lead[]).map(l => l.id)));
        setFeedbackMessage(`📄 ${parsedLeads.length} estabelecimentos carregados da planilha! Selecione e clique em "Adicionar à Carteira" para gravar de vez.`);
      } catch (err: any) {
        alert(err.message || 'Erro ao processar planilha Excel.');
      } finally {
        setImportingExcel(false);
        if (excelInputRef.current) excelInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === searchResults.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(searchResults.map(l => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  const handleImport = async () => {
    const toImport = searchResults.filter(l => selectedLeadIds.has(l.id));
    if (toImport.length === 0) {
      alert('Selecione ao menos 1 lead para adicionar à carteira.');
      return;
    }

    setImporting(true);
    try {
      const targetUser = currentUser.role === 'admin' ? assigneeId : undefined;
      const res = await api.importLeads(toImport, targetUser);
      setFeedbackMessage(`✅ ${res.count} estabelecimentos adicionados com sucesso à carteira!`);
      onLeadsImported();

      // Remove da pré-visualização os que foram importados
      setSearchResults(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
      setSelectedLeadIds(new Set());
    } catch (err: any) {
      alert(err.message || 'Erro ao importar leads.');
    } finally {
      setImporting(false);
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const cleanPhone = lead.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá, tudo bem? Sou ${currentUser.name} da equipe corporativa da SKY Brasil.\n\n` +
      `Trabalhamos com soluções dedicadas de entretenimento em HD e conectividade para ${lead.ramoLabel.toLowerCase()}, como o ${lead.tradeName}.\n\n` +
      `Gostaria de agendar uma breve visita técnica para apresentar nossas condições comerciais corporativas de faturamento direto com a operadora.\n\n` +
      `Quem é o responsável pelas decisões de telecom/TV no estabelecimento?`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openMaps = (lead: Lead) => {
    const query = encodeURIComponent(`${lead.tradeName}, ${lead.street}, ${lead.number}, ${lead.city} - ${lead.state}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const currentStateObj = states.find(s => s.uf === selectedState);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className={`bg-gradient-to-r ${theme.heroGradient} border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} text-xs font-semibold mb-3`}>
              <Sparkles className="w-3.5 h-3.5" />
              Mineração Segmentada B2B • SCM TECH
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gerador & Localizador de Leads Corporativos
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Filtre por ramo, estado e cidade para extrair na hora telefones comerciais, WhatsApp, endereços completos e estimativa de telas para prospecção ativa.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-4 text-center">
              <span className={`block text-2xl font-black ${theme.highlightText}`}>3 Ramos</span>
              <span className="text-xs text-slate-400 font-medium">Foco em Alto Volume</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-4 text-center">
              <span className="block text-2xl font-black text-emerald-400">27 UFs</span>
              <span className="text-xs text-slate-400 font-medium">Brasil Completo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className={`w-5 h-5 ${theme.highlightText}`} />
            <span>Buscar & Minerar Estabelecimentos:</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Pesquise por nome livre ou use os filtros por ramo e localidade
          </span>
        </div>

        {/* Barra de Pesquisa Livre (Nome, Rede ou Palavra-Chave) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-4 h-4 text-amber-500" />
              Pesquisa Livre por Nome, Rede ou Palavra-Chave:
            </span>
            <span className="text-[11px] text-slate-400 font-normal normal-case">
              (Ex: Ibis, Copacabana, Fasano, Outback, Samaritano, Santa Casa, Choperia...)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Digite o nome de um hotel, hospital, bar ou termo para pesquisar diretamente..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-300 transition cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 bg-amber-400 hover:bg-amber-500 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Pesquisando...' : 'Buscar Agora'}
            </button>
          </div>
        </div>

        {/* 1. Escolha do Ramo */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            1. Selecione o Ramo Alvo:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Hoteis */}
            <button
              type="button"
              onClick={() => setSelectedRamo('hoteis')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                selectedRamo === 'hoteis'
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedRamo === 'hoteis' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                <Hotel className="w-6 h-6" />
              </div>
              <div>
                <span className="block font-bold text-sm">Hotéis & Pousadas</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Hotéis, Pousadas, Resorts e Hostels (20 a 250 quartos/telas)
                </span>
              </div>
            </button>

            {/* Hospitais */}
            <button
              type="button"
              onClick={() => setSelectedRamo('hospitais')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                selectedRamo === 'hospitais'
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedRamo === 'hospitais' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="block font-bold text-sm">Hospitais & Clínicas</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Hospitais, Centros de Internação e Leitos (40 a 300 pontos)
                </span>
              </div>
            </button>

            {/* Bares e Restaurantes */}
            <button
              type="button"
              onClick={() => setSelectedRamo('bares_restaurantes')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                selectedRamo === 'bares_restaurantes'
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                selectedRamo === 'bares_restaurantes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <span className="block font-bold text-sm">Bares & Restaurantes (Grandes)</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Choperias, Churrascarias e Bares Esportivos (8 a 45 telões/telas)
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Seleção de Localidade e Quantidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Estado UF */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              2. Estado (UF):
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {states.map((st) => (
                <option key={st.uf} value={st.uf}>
                  {st.uf} - {st.name} (DDD {st.ddd})
                </option>
              ))}
            </select>
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              3. Cidade / Região:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {currentStateObj?.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
              <option value="Região Metropolitana">Toda a Região Metropolitana</option>
            </select>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Quantidade de Leads:
            </label>
            <select
              value={leadCount}
              onChange={(e) => setLeadCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value={50}>50 Estabelecimentos</option>
              <option value={100}>100 Estabelecimentos</option>
              <option value={250}>250 Estabelecimentos</option>
              <option value={500}>500 Estabelecimentos</option>
              <option value={1000}>1.000 Estabelecimentos</option>
              <option value={2000}>🔥 2.000 (Base Completa / Máximo Possível)</option>
            </select>
          </div>

          {/* Botão de Busca */}
          <div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-105 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Gerar Lista Agora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Oculto de Arquivo Excel */}
        <input
          type="file"
          ref={excelInputRef}
          onChange={handleExcelUpload}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />

        {/* Card de Importação de Planilha Excel com Contatos Reais */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-xs text-emerald-950">
                Tem uma lista própria com telefones e WhatsApps reais?
              </span>
              <span className="block text-[11px] text-emerald-800">
                Suba planilhas em Excel (.xlsx ou .csv) diretamente para disparar no WhatsApp com seus clientes verdadeiros.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            disabled={importingExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{importingExcel ? 'Processando Planilha...' : 'Subir Planilha Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedbackMessage}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline text-emerald-700 hover:text-emerald-900"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Search Results Preview */}
      {searchResults.length > 0 && (() => {
        const filteredSearchResults = searchResults.filter((l) => {
          if (!resultFilter.trim()) return true;
          const term = resultFilter.toLowerCase().trim();
          return (
            l.tradeName.toLowerCase().includes(term) ||
            l.companyName.toLowerCase().includes(term) ||
            l.neighborhood.toLowerCase().includes(term) ||
            l.city.toLowerCase().includes(term) ||
            l.cnpj.includes(term) ||
            l.phone.includes(term) ||
            l.whatsapp.includes(term)
          );
        });

        const totalPages = itemsPerPage > 0 ? Math.ceil(filteredSearchResults.length / itemsPerPage) : 1;
        const paginatedResults = itemsPerPage > 0 
          ? filteredSearchResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          : filteredSearchResults;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Action Header */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  {selectedLeadIds.size === searchResults.length ? (
                    <CheckSquare className="w-5 h-5 text-red-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                  <span>
                    Selecionar Todos ({selectedLeadIds.size}/{searchResults.length})
                  </span>
                </button>

                <div className="relative">
                  <input
                    type="text"
                    value={resultFilter}
                    onChange={(e) => {
                      setResultFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filtrar nesta lista..."
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Se for Admin, pode atribuir a outro vendedor */}
                {currentUser.role === 'admin' && allUsers.length > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-500 font-medium">Atribuir a:</span>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="font-bold text-slate-800 bg-transparent focus:outline-none"
                    >
                      <option value={currentUser.id}>Minha Própria Carteira (Adm)</option>
                      {allUsers
                        .filter(u => u.id !== currentUser.id)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} (@{u.username})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || selectedLeadIds.size === 0}
                  className="py-2.5 px-5 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {importing ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Adicionar Todos ({selectedLeadIds.size}) à Carteira</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">Sel.</th>
                    <th className="py-3.5 px-4">Estabelecimento / Razão Social</th>
                    <th className="py-3.5 px-4">Potencial / Capacidade</th>
                    <th className="py-3.5 px-4">Telefones & Contato</th>
                    <th className="py-3.5 px-4">Localização / Endereço</th>
                    <th className="py-3.5 px-4 text-center">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedResults.map((lead) => {
                    const isSelected = selectedLeadIds.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isSelected ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(lead.id)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-red-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Nome & CNPJ */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <span>{lead.tradeName}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.companyName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-slate-400">CNPJ: {lead.cnpj}</span>
                            <span className="text-[11px] text-slate-400">• Decisor: <strong>{lead.contactPerson}</strong></span>
                          </div>
                        </td>

                        {/* Estimativa de Telas / Quartos */}
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100/70 text-red-800 text-xs font-bold">
                            <Tv className="w-3.5 h-3.5 text-red-600" />
                            <span>{lead.estimatedScreens}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-2">
                            {lead.skySolution}
                          </p>
                        </td>

                        {/* Telefones */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <a
                              href={`tel:${lead.phone.replace(/\D/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-red-600"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{lead.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lead.whatsapp}</span>
                            </a>
                          </div>
                        </td>

                        {/* Endereço */}
                        <td className="py-4 px-4">
                          <p className="text-xs text-slate-700 font-medium">
                            {lead.street}, {lead.number} - {lead.neighborhood}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lead.city} - {lead.state} | CEP: {lead.cep}
                          </p>
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`tel:${lead.phone.replace(/\D/g, '')}`}
                              title="Ligar Agora"
                              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openWhatsApp(lead)}
                              title="Abrir WhatsApp com Proposta Comercial"
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openMaps(lead)}
                              title="Ver Endereço no Google Maps"
                              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLead(lead)}
                              title="Editar Contato / WhatsApp Real"
                              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Exibindo:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded border border-slate-300 bg-white font-bold"
                >
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                  <option value={250}>250 por página</option>
                  <option value={-1}>Ver Todos ({filteredSearchResults.length})</option>
                </select>
                <span>de <strong>{filteredSearchResults.length}</strong> estabelecimentos</span>
              </div>

              {totalPages > 1 && itemsPerPage > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 font-bold">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal de Edição de Contato na Prévia */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSaveLead={(updatedFields) => {
            setSearchResults(prev =>
              prev.map(l => (l.id === editingLead.id ? { ...l, ...updatedFields } as Lead : l))
            );
            setEditingLead(null);
          }}
          onSuccess={() => {
            setEditingLead(null);
          }}
        />
      )}
    </div>
  );
};

export type UserRole = 'admin' | 'vendedor';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active?: boolean;
  createdAt?: string;
  metrics?: {
    totalLeads: number;
    totalCalls: number;
    scheduledVisits: number;
    closedDeals: number;
  };
}

export type LeadStatus = 'NOVO' | 'TENTANDO' | 'NEGOCIACAO' | 'AGENDADO' | 'FECHADO' | 'SEM_INTERESSE';

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  userName: string;
}

export interface Lead {
  id: string;
  userId: string | null;
  userName: string | null;
  ramo: 'hoteis' | 'hospitais' | 'bares_restaurantes';
  ramoLabel: string;
  tradeName: string;
  companyName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  estimatedScreens: string;
  screensCount: number;
  contactPerson: string;
  skySolution: string;
  cnae: string;
  status: LeadStatus;
  visitDate: string | null;
  visitNotes: string | null;
  callCount: number;
  lastCallAt: string | null;
  notes: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

export interface StateConfig {
  uf: string;
  name: string;
  ddd: string;
  cities: string[];
}

export interface RamoConfig {
  id: 'hoteis' | 'hospitais' | 'bares_restaurantes';
  label: string;
  shortLabel: string;
  icon: string;
  cnaes: string[];
  skyPitch: string;
  unitLabel: string;
}

export interface DashboardStats {
  total: number;
  novos: number;
  tentando: number;
  negociacao: number;
  agendados: number;
  fechados: number;
  semInteresse: number;
  totalLigacoes: number;
}

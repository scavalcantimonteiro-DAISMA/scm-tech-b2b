import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  Phone, 
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface UserManagementViewProps {
  currentUser: User;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário de criação
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'vendedor' | 'admin'>('vendedor');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal para trocar senha
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreating(true);

    try {
      await api.createUser({
        name,
        username,
        password,
        role
      });
      setSuccessMsg(`Usuário "${username}" criado com sucesso! Ele já pode fazer login no sistema.`);
      setName('');
      setUsername('');
      setPassword('');
      setRole('vendedor');
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.username.toLowerCase() === 'adm') {
      alert('O Administrador principal não pode ser desativado.');
      return;
    }
    try {
      await api.updateUser(user.id, { active: !user.active });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do usuário');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.trim().length === 0) {
      alert('Digite a nova senha.');
      return;
    }

    try {
      await api.updateUser(userId, { password: newPassword });
      alert('Senha alterada com sucesso!');
      setEditingUserId(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar senha');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.username.toLowerCase() === 'adm') {
      alert('O Administrador principal não pode ser removido.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o acesso de "${user.name}" (@${user.username})?`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo */}
      <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 sm:p-8 rounded-2xl border border-amber-500/30 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4" />
              Painel de Controle do Administrador
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestão de Usuários & Equipe de Vendas
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Crie logins e senhas para os vendedores da sua equipe SKY. Cada vendedor terá acesso isolado à sua própria carteira, evitando qualquer sobreposição ou confusão.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-4 text-center shrink-0">
            <span className="text-xs text-slate-400 font-medium block">Usuários Cadastrados</span>
            <span className="text-3xl font-black text-amber-400 block mt-0.5">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação de Usuário */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <span>Criar Novo Usuário</span>
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nome Completo do Vendedor
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Login / Usuário (para entrar)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: joao.sky"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Senha Inicial
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Defina uma senha"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nível de Permissão
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="vendedor">💼 Vendedor / SDR (Acessa apenas sua carteira)</option>
                <option value="admin">👑 Administrador (Acesso total + cria usuários)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creating ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Usuários e Estatísticas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              <span>Equipe Cadastrada & Acessos</span>
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs">Carregando usuários...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => {
                  const isMainAdmin = u.username.toLowerCase() === 'adm';
                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-xl border transition ${
                        u.active ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Info Usuário */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-base">{u.name}</span>
                            {u.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
                                ADMINISTRADOR
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                                VENDEDOR
                              </span>
                            )}
                            {!u.active && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                                INATIVO
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500">Login: @{u.username}</span>

                          {/* Métricas do Vendedor */}
                          {u.metrics && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                <strong>{u.metrics.totalLeads}</strong> leads na carteira
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <strong>{u.metrics.totalCalls}</strong> ligações feitas
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CalendarCheck className="w-3.5 h-3.5" />
                                <strong>{u.metrics.scheduledVisits}</strong> visitas agendadas
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Botão Redefinir Senha */}
                          <button
                            type="button"
                            onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                            title="Alterar Senha"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 transition cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Botão Ativar / Desativar */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              title={u.active ? 'Desativar Acesso' : 'Ativar Acesso'}
                              className={`p-2 rounded-lg border transition cursor-pointer ${
                                u.active
                                  ? 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                            >
                              {u.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Botão Excluir */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title="Excluir Usuário"
                              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Caixa de Alteração de Senha rápida */}
                      {editingUserId === u.id && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                          <input
                            type="password"
                            placeholder="Digite a nova senha para este usuário"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Salvar Senha
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingUserId(null); setNewPassword(''); }}
                            className="text-xs text-slate-500 hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

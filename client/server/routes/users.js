import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = Router();

// Todas as rotas de usuários exigem autenticação e privilégio de ADMIN
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users - Lista todos os usuários e suas métricas de desempenho
router.get('/', (req, res) => {
  const db = getDb();
  
  const usersWithMetrics = db.users.map(u => {
    const userLeads = db.leads.filter(l => l.userId === u.id);
    const totalCalls = userLeads.reduce((acc, l) => acc + (l.callCount || 0), 0);
    const scheduledVisits = userLeads.filter(l => l.status === 'AGENDADO').length;
    const closedDeals = userLeads.filter(l => l.status === 'FECHADO').length;

    return {
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      metrics: {
        totalLeads: userLeads.length,
        totalCalls,
        scheduledVisits,
        closedDeals
      }
    };
  });

  res.json(usersWithMetrics);
});

// POST /api/users - Cria um novo usuário
router.post('/', async (req, res) => {
  try {
    const { name, username, password, role = 'vendedor' } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Preencha Nome, Login e Senha.' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Este login já está em uso por outro usuário.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      username: username.trim(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'vendedor',
      active: true,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await saveDb();

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        active: newUser.active
      }
    });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

// PUT /api/users/:id - Atualiza usuário (nome, senha, status ativo/inativo)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, active, role } = req.body;
    const db = getDb();

    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (name) user.name = name.trim();
    if (typeof active === 'boolean') user.active = active;
    if (role && (role === 'admin' || role === 'vendedor')) user.role = role;
    if (password && password.trim().length > 0) {
      user.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    await saveDb();

    res.json({
      message: 'Usuário atualizado com sucesso.',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active
      }
    });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /api/users/:id - Exclui usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (id === 'usr_admin_default' || (req.user && req.user.id === id)) {
      return res.status(400).json({ error: 'Não é permitido excluir o Administrador principal.' });
    }

    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    db.users.splice(index, 1);
    await saveDb();

    res.json({ message: 'Usuário removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

export default router;

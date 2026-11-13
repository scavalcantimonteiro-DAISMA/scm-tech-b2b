import { Router } from 'express';
import { getDb, saveDb, syncDb } from '../db.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = Router();

// GET /api/system/status
router.get('/status', (req, res) => {
  const db = getDb();
  const hasKv = Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
  res.json({
    ok: true,
    persistence: hasKv ? 'cloud_kv' : 'local_and_browser_sync',
    usersCount: db.users.length,
    leadsCount: db.leads.length,
    isVercel: Boolean(process.env.VERCEL)
  });
});

// Todas as rotas abaixo requerem Admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/system/backup - Exporta backup seguro completo da base
router.get('/backup', (req, res) => {
  const db = getDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sky_b2b_backup_${Date.now()}.json"`);
  res.json({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    users: db.users,
    leads: db.leads
  });
});

// POST /api/system/restore - Restaura backup completo
router.post('/restore', async (req, res) => {
  try {
    const { users, leads } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Formato de backup inválido: "users" deve ser um array.' });
    }

    const db = getDb();
    db.users = users;
    if (Array.isArray(leads)) {
      db.leads = leads;
    }
    await saveDb();

    res.json({
      message: 'Base de dados restaurada com sucesso!',
      usersCount: db.users.length,
      leadsCount: db.leads.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao restaurar backup: ' + err.message });
  }
});

// POST /api/system/sync - Sincroniza e mescla vendedores do navegador para o servidor (evita perda em cold starts)
router.post('/sync', async (req, res) => {
  try {
    const { users = [], leads = [] } = req.body;
    const db = await syncDb({ users, leads });
    res.json({
      message: 'Sincronização concluída com sucesso!',
      usersCount: db.users.length,
      leadsCount: db.leads.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao sincronizar: ' + err.message });
  }
});

export default router;

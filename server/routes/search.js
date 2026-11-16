import { Router } from 'express';
import { BRAZIL_STATES, RAMOS_CONFIG } from '../data/brazilData.js';
import { generateLeadsForSearch } from '../db.js';
import { authenticateToken } from './auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/search/meta - Retorna estados, cidades principais e ramos disponíveis
router.get('/meta', (req, res) => {
  res.json({
    states: BRAZIL_STATES,
    ramos: Object.values(RAMOS_CONFIG)
  });
});

// GET /api/search/leads - Busca e minera leads no ramo e localidade selecionados
router.get('/leads', (req, res) => {
  try {
    const { ramo = 'hoteis', uf = 'SP', city, count = 15, keyword } = req.query;

    const leads = generateLeadsForSearch({
      ramo,
      uf,
      city: city || undefined,
      count: parseInt(count, 10) || 15,
      keyword: keyword ? String(keyword).trim() : ''
    });

    res.json({
      total: leads.length,
      filters: { ramo, uf, city, keyword: keyword || null },
      leads
    });
  } catch (err) {
    console.error('Erro na busca de leads:', err);
    res.status(500).json({ error: 'Erro ao gerar e buscar leads.' });
  }
});

export default router;

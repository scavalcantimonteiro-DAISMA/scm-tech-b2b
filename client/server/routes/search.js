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

// GET /api/search/cnpj/:cnpj - Consulta oficial em tempo real na Receita Federal
router.get('/cnpj/:cnpj', async (req, res) => {
  try {
    const cleanCnpj = req.params.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos.' });
    }

    // 1. Tenta MinhaReceita
    try {
      const response = await fetch(`https://minhareceita.org/${cleanCnpj}`, {
        signal: AbortSignal.timeout(4500)
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, source: 'MinhaReceita (Oficial RFB)', data });
      }
    } catch (e) {
      // Fallback para BrasilAPI
    }

    // 2. Fallback BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        headers: { 'User-Agent': 'B2BProspector/1.0' },
        signal: AbortSignal.timeout(4500)
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, source: 'BrasilAPI (Oficial RFB)', data });
      }
    } catch (e) {}

    res.status(404).json({ error: 'CNPJ não encontrado nas bases oficiais da Receita Federal.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar CNPJ em tempo real.' });
  }
});

// GET /api/search/leads - Busca e minera leads no ramo e localidade selecionados
router.get('/leads', async (req, res) => {
  try {
    const { ramo = 'hospitais', uf = 'BA', city, count = 50, keyword } = req.query;

    let leads = generateLeadsForSearch({
      ramo,
      uf,
      city: city || undefined,
      count: parseInt(count, 10) || 50,
      keyword: keyword ? String(keyword).trim() : ''
    });

    // Se o usuário digitou um CNPJ específico na busca que não está no catálogo local
    const rawDigits = (keyword || '').replace(/\D/g, '');
    if (rawDigits.length === 14 && leads.length === 0) {
      try {
        const rfRes = await fetch(`https://minhareceita.org/${rawDigits}`, { signal: AbortSignal.timeout(4000) });
        if (rfRes.ok) {
          const d = await rfRes.json();
          const ramoConfig = RAMOS_CONFIG[ramo] || RAMOS_CONFIG.hospitais;
          leads.push({
            id: `lead_${rawDigits}`,
            userId: null,
            userName: null,
            ramo: ramo,
            ramoLabel: ramoConfig.shortLabel,
            tradeName: d.nome_fantasia || d.razao_social,
            companyName: d.razao_social,
            cnpj: `${d.cnpj.slice(0,2)}.${d.cnpj.slice(2,5)}.${d.cnpj.slice(5,8)}/${d.cnpj.slice(8,12)}-${d.cnpj.slice(12,14)}`,
            phone: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0,2)}) ${d.ddd_telefone_1.slice(2)}` : '',
            whatsapp: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0,2)}) ${d.ddd_telefone_1.slice(2)}` : '',
            email: d.email ? d.email.toLowerCase() : '',
            website: '',
            street: `${d.descricao_tipo_de_logradouro || ''} ${d.logradouro || ''}`.trim(),
            number: d.numero || '',
            neighborhood: d.bairro || '',
            city: d.municipio || city,
            state: d.uf || uf,
            cep: d.cep ? `${d.cep.slice(0,5)}-${d.cep.slice(5,8)}` : '',
            estimatedScreens: `50 ${ramoConfig.unitLabel}`,
            screensCount: 50,
            contactPerson: 'Diretoria / Sócios (Receita Federal)',
            skySolution: ramoConfig.skyPitch,
            cnae: d.cnae_fiscal ? `${d.cnae_fiscal} - ${d.cnae_fiscal_descricao || ''}` : ramoConfig.cnaes[0],
            status: 'NOVO',
            visitDate: null,
            visitNotes: null,
            callCount: 0,
            lastCallAt: null,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn('Falha na busca dinâmica de CNPJ:', e.message);
      }
    }

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

import { Router } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/leads - Retorna os leads do usuário logado (com isolamento estrito)
// Se for Administrador, pode passar ?targetUserId=all ou ?targetUserId=usr_... para auditar
router.get('/', (req, res) => {
  const db = getDb();
  const { status, ramo, search, state, city, targetUserId } = req.query;

  let leads = [...db.leads];

  // Regra de Isolamento de Carteira:
  if (req.user.role !== 'admin') {
    // Vendedor comum vê ESTRITAMENTE os seus próprios leads
    leads = leads.filter(l => l.userId === req.user.id);
  } else {
    // Administrador:
    if (targetUserId && targetUserId !== 'all') {
      leads = leads.filter(l => l.userId === targetUserId);
    } else if (!targetUserId) {
      // Se não passou parâmetro, mostra a própria carteira do Adm por padrão
      leads = leads.filter(l => l.userId === req.user.id);
    }
    // Se targetUserId === 'all', mostra tudo para o Adm
  }

  // Filtros adicionais
  if (status && status !== 'ALL') {
    leads = leads.filter(l => l.status === status);
  }
  if (ramo && ramo !== 'ALL') {
    leads = leads.filter(l => l.ramo === ramo);
  }
  if (state && state !== 'ALL') {
    leads = leads.filter(l => l.state === state);
  }
  if (city) {
    leads = leads.filter(l => l.city.toLowerCase().includes(city.toLowerCase().trim()));
  }
  if (search) {
    const term = search.toLowerCase().trim();
    leads = leads.filter(l =>
      l.tradeName.toLowerCase().includes(term) ||
      l.companyName.toLowerCase().includes(term) ||
      l.cnpj.includes(term) ||
      l.phone.includes(term) ||
      l.whatsapp.includes(term) ||
      l.city.toLowerCase().includes(term) ||
      l.neighborhood.toLowerCase().includes(term)
    );
  }

  // Ordena por data de atualização mais recente
  leads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json(leads);
});

// GET /api/leads/stats - Métricas do painel
router.get('/stats', (req, res) => {
  const db = getDb();
  const { targetUserId } = req.query;

  let leads = db.leads;

  if (req.user.role !== 'admin') {
    leads = leads.filter(l => l.userId === req.user.id);
  } else if (targetUserId && targetUserId !== 'all') {
    leads = leads.filter(l => l.userId === targetUserId);
  }

  const stats = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'NOVO').length,
    tentando: leads.filter(l => l.status === 'TENTANDO').length,
    negociacao: leads.filter(l => l.status === 'NEGOCIACAO').length,
    agendados: leads.filter(l => l.status === 'AGENDADO').length,
    fechados: leads.filter(l => l.status === 'FECHADO').length,
    semInteresse: leads.filter(l => l.status === 'SEM_INTERESSE').length,
    totalLigacoes: leads.reduce((acc, l) => acc + (l.callCount || 0), 0)
  };

  res.json(stats);
});

// POST /api/leads/import - Adiciona leads gerados na carteira do usuário logado
router.post('/import', async (req, res) => {
  try {
    const { leads: incomingLeads, assignToUserId } = req.body;

    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) {
      return res.status(400).json({ error: 'Nenhum lead fornecido para importação.' });
    }

    const db = getDb();
    let targetUserId = req.user.id;
    let targetUserName = req.user.name;

    // Se admin quiser atribuir diretamente a outro vendedor:
    if (req.user.role === 'admin' && assignToUserId) {
      const assignedUser = db.users.find(u => u.id === assignToUserId);
      if (assignedUser) {
        targetUserId = assignedUser.id;
        targetUserName = assignedUser.name;
      }
    }

    const imported = [];
    const now = new Date().toISOString();

    for (const lead of incomingLeads) {
      // Evita duplicatas do mesmo CNPJ na carteira do mesmo usuário
      const exists = db.leads.some(l => l.cnpj === lead.cnpj && l.userId === targetUserId);
      if (!exists) {
        const newLead = {
          ...lead,
          id: lead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
          userId: targetUserId,
          userName: targetUserName,
          status: lead.status || 'NOVO',
          callCount: 0,
          lastCallAt: null,
          visitDate: lead.visitDate || null,
          visitNotes: lead.visitNotes || null,
          notes: lead.notes || [],
          createdAt: now,
          updatedAt: now
        };
        db.leads.push(newLead);
        imported.push(newLead);
      }
    }

    await saveDb();

    res.status(201).json({
      message: `${imported.length} lead(s) adicionados à carteira com sucesso!`,
      count: imported.length,
      leads: imported
    });
  } catch (err) {
    console.error('Erro na importação:', err);
    res.status(500).json({ error: 'Erro ao importar leads.' });
  }
});

// PUT /api/leads/:id/status - Atualiza status do lead (se ligou, agendou visita, fechou)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, visitDate, visitNotes, note } = req.body;
    const db = getDb();

    const lead = db.leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    // Checa permissão (apenas dono ou admin)
    if (req.user.role !== 'admin' && lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado a este lead.' });
    }

    const previousStatus = lead.status;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();

    if (status === 'AGENDADO') {
      lead.visitDate = visitDate || lead.visitDate || new Date().toISOString();
      if (visitNotes) lead.visitNotes = visitNotes;
    }

    // Se enviou uma nota junto com a mudança de status
    if (note && note.trim()) {
      lead.notes.push({
        id: `note_${Date.now()}`,
        text: note.trim(),
        createdAt: new Date().toISOString(),
        userName: req.user.name
      });
    } else if (previousStatus !== status) {
      lead.notes.push({
        id: `note_${Date.now()}`,
        text: `Status alterado de "${previousStatus}" para "${status}".`,
        createdAt: new Date().toISOString(),
        userName: req.user.name
      });
    }

    await saveDb();

    res.json({ message: 'Status atualizado com sucesso!', lead });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

// POST /api/leads/:id/call - Registra ligação realizada
router.post('/:id/call', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const db = getDb();

    const lead = db.leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    if (req.user.role !== 'admin' && lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado a este lead.' });
    }

    lead.callCount = (lead.callCount || 0) + 1;
    lead.lastCallAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    // Se estiver como NOVO, passa para TENTANDO automaticamente
    if (lead.status === 'NOVO') {
      lead.status = 'TENTANDO';
    }

    lead.notes.push({
      id: `call_${Date.now()}`,
      text: note ? `📞 Ligação realizada: ${note}` : `📞 Tentativa de contato telefônico registrada (${lead.callCount}ª ligação).`,
      createdAt: new Date().toISOString(),
      userName: req.user.name
    });

    await saveDb();

    res.json({ message: 'Ligação registrada com sucesso!', lead });
  } catch (err) {
    console.error('Erro ao registrar ligação:', err);
    res.status(500).json({ error: 'Erro ao registrar ligação.' });
  }
});

// POST /api/leads/:id/notes - Adiciona anotação livre ao lead
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const db = getDb();

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da nota é obrigatório.' });
    }

    const lead = db.leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    if (req.user.role !== 'admin' && lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado a este lead.' });
    }

    const newNote = {
      id: `note_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      userName: req.user.name
    };

    lead.notes.push(newNote);
    lead.updatedAt = new Date().toISOString();

    await saveDb();

    res.status(201).json({ message: 'Anotação salva com sucesso.', lead });
  } catch (err) {
    console.error('Erro ao adicionar anotação:', err);
    res.status(500).json({ error: 'Erro ao salvar nota.' });
  }
});

// DELETE /api/leads/:id - Remove lead da carteira
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const index = db.leads.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    const lead = db.leads[index];
    if (req.user.role !== 'admin' && lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado para excluir este lead.' });
    }

    db.leads.splice(index, 1);
    await saveDb();

    res.json({ message: 'Lead removido da sua carteira.' });
  } catch (err) {
    console.error('Erro ao excluir lead:', err);
    res.status(500).json({ error: 'Erro ao excluir lead.' });
  }
});

export default router;

import { app } from './app.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDb();
    console.log('✅ Banco de dados inicializado com sucesso.');
    console.log('👤 Administrador padrão: Adm | Senha: [configurada]');

    const HOST = '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
      console.log(`🌐 Acesso na rede local (outros computadores/celulares): http://192.168.1.188:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import leadsRoutes from './routes/leads.js';
import searchRoutes from './routes/search.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());

// Garante que o banco seja inicializado na primeira requisição (crucial no Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/search', searchRoutes);

// Servir frontend compilado em produção (pasta dist)
const clientDist = path.join(__dirname, '..', 'dist');
app.use(express.static(clientDist));
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Fallback para SPA no Express 5
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('SCM TECH B2B Lead Master - API Operacional');
    }
  });
});

export default app;

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { router: authRoutes } = require('./routes/auth');
const adsRoutes = require('./routes/ads');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));


const categoriesRoutes = require('./routes/categories');
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/categories', categoriesRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  let uri = process.env.MONGO_URI;

  if (uri) {
    if (!uri.includes('%24')) {
      try {
        const url = new URL(uri);
        url.password = encodeURIComponent(url.password);
        uri = url.toString();
      } catch {}
    }
    try {
      await mongoose.connect(uri);
      console.log('MongoDB Atlas Conectado');
    } catch (err) {
      console.log('Atlas indisponivel (' + err.message + '), usando MongoDB local...');
      uri = null;
    }
  }

  if (!uri) {
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('MongoDB Local (em memoria) Conectado');
  }

  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('Índice email_1 removido da coleção users');
  } catch {
    // índice já não existe, segue o jogo
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

start().catch(err => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('./config/env');
const { createApp } = require('./app');

const app = createApp();

async function connectDb() {
  let uri = config.mongoUri;

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
      return;
    } catch (err) {
      console.log('Atlas indisponivel (' + err.message + '), usando MongoDB local...');
    }
  }

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('MongoDB Local (em memoria) Conectado');
}

async function start() {
  await connectDb();

  try {
    const AuthCode = require('./models/AuthCode');
    const OAuthState = require('./models/OAuthState');
    await Promise.all([AuthCode.syncIndexes(), OAuthState.syncIndexes()]);
  } catch (err) {
    console.error('Aviso: falha ao sincronizar indices TTL:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`Servidor rodando na porta ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});

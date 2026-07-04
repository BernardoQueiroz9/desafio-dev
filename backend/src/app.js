const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');

const { router: authRoutes } = require('./routes/auth');
const adsRoutes = require('./routes/ads');
const categoriesRoutes = require('./routes/categories');

/**
 * Cria e configura a aplicacao Express (sem escutar porta nem conectar DB).
 * Facilita testes de integracao (Supertest) e mantem o bootstrap em server.js.
 */
function createApp() {
  const app = express();

  const ALLOWED_ORIGINS = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:4173',
    'https://desafio-dev-two.vercel.app',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      // Sem origin (curl/health checks) e origens da allowlist sao permitidas.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
  }));

  // A API nao serve HTML; CSP restritiva e sem necessidade de recursos cross-site.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/ads', adsRoutes);
  app.use('/api/categories', categoriesRoutes);

  return app;
}

module.exports = { createApp };

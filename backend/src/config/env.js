/**
 * Validacao e centralizacao de variaveis de ambiente (fail-fast).
 *
 * Em producao, a ausencia de qualquer variavel obrigatoria encerra o processo
 * com mensagem clara — nunca subimos com o JWT_SECRET default inseguro.
 * Em desenvolvimento/teste, aplicamos defaults apenas para nao travar o fluxo local.
 */
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const REQUIRED_IN_PROD = ['JWT_SECRET', 'ML_CLIENT_ID', 'ML_CLIENT_SECRET', 'ML_REDIRECT_URI'];

const DEV_JWT_SECRET = 'dev-secret-change-in-production';

function validate() {
  if (!isProd) return;
  const missing = REQUIRED_IN_PROD.filter((k) => !process.env[k] || !process.env[k].trim());
  if (missing.length > 0) {
    console.error(
      `[FATAL] Variaveis de ambiente obrigatorias ausentes em producao: ${missing.join(', ')}.\n` +
      'Configure-as no painel do provedor (Render) antes de subir o servico.'
    );
    process.exit(1);
  }
  if (process.env.JWT_SECRET === DEV_JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET esta usando o valor default de desenvolvimento em producao. Gere um segredo forte.');
    process.exit(1);
  }
}

validate();

const config = {
  isProd,
  isTest,
  port: process.env.PORT || 3000,
  // Em dev/test aceitamos o default; validate() ja garantiu que em prod ha um valor real.
  jwtSecret: process.env.JWT_SECRET || DEV_JWT_SECRET,
  mongoUri: process.env.MONGO_URI || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  ml: {
    clientId: process.env.ML_CLIENT_ID || '',
    clientSecret: process.env.ML_CLIENT_SECRET || '',
    redirectUri: process.env.ML_REDIRECT_URI || 'http://localhost:3000/api/auth/ml/callback',
    siteId: process.env.ML_SITE_ID || 'MLB',
  },
};

module.exports = config;

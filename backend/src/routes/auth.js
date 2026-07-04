const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const User = require('../models/User');
const OAuthState = require('../models/OAuthState');
const AuthCode = require('../models/AuthCode');
const ml = require('../services/mercadolibre');
const router = express.Router();

const JWT_SECRET = config.jwtSecret;

function getFrontendUrl(req) {
  return config.frontendUrl || req.headers.origin || 'https://desafio-dev-two.vercel.app';
}

function signSessionToken(userId, mlUserId) {
  return jwt.sign({ userId: String(userId), mlUserId: String(mlUserId) }, JWT_SECRET, { expiresIn: '7d' });
}

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = decoded.userId;
    req.mlUserId = decoded.mlUserId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Inicia o fluxo OAuth: gera state + PKCE verifier e persiste no Mongo (TTL ~5min).
router.get('/ml/login', async (req, res) => {
  try {
    const redirectUri = config.ml.redirectUri;
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    await OAuthState.create({ _id: state, codeVerifier });

    const url = ml.getAuthUrl(redirectUri, state, codeChallenge);
    res.redirect(url);
  } catch (err) {
    console.error('Erro ao iniciar login ML:', err.message);
    res.redirect(`${getFrontendUrl(req)}/?error=login_init_failed`);
  }
});

// Callback do ML: valida o state (uso unico), troca o code por tokens e
// entrega ao frontend um `code` opaco de uso unico (nunca o JWT na URL).
router.get('/ml/callback', async (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  try {
    const { code, error, state } = req.query;

    const stored = await OAuthState.findOneAndDelete({ _id: state });
    if (!stored) {
      return res.redirect(`${frontendUrl}/?error=invalid_state`);
    }
    // Checagem explicita de idade (nao confiar so no TTL, que varre ~1x/min).
    if (Date.now() - new Date(stored.createdAt).getTime() > 5 * 60 * 1000) {
      return res.redirect(`${frontendUrl}/?error=invalid_state`);
    }

    if (error || !code) {
      return res.redirect(`${frontendUrl}/?error=${error || 'no_code'}`);
    }

    const redirectUri = config.ml.redirectUri;
    const tokenData = await ml.exchangeCode(code, redirectUri, stored.codeVerifier);
    const { access_token, refresh_token, user_id, expires_in } = tokenData;

    const mlUser = await ml.getUser(access_token);
    const email = mlUser.email || '';
    const name = [mlUser.first_name, mlUser.last_name].filter(Boolean).join(' ') || mlUser.nickname || email.split('@')[0] || 'Vendedor';
    const mlNickname = mlUser.nickname || '';

    let user = await User.findOne({ ml_user_id: String(user_id) });
    if (user) {
      user.ml_access_token = access_token;
      if (refresh_token) user.ml_refresh_token = refresh_token;
      user.ml_token_expires_at = new Date(Date.now() + expires_in * 1000);
      user.name = name;
      user.ml_nickname = mlNickname;
      if (email) user.email = email;
    } else {
      user = await User.create({
        name,
        ml_nickname: mlNickname,
        email,
        ml_user_id: String(user_id),
        ml_access_token: access_token,
        ...(refresh_token && { ml_refresh_token: refresh_token }),
        ml_token_expires_at: new Date(Date.now() + expires_in * 1000),
      });
    }
    await user.save();

    const authCode = crypto.randomBytes(32).toString('base64url');
    await AuthCode.create({
      _id: authCode,
      userId: user._id,
      mlUserId: String(user_id),
      userName: name,
    });

    res.redirect(`${frontendUrl}/?code=${authCode}`);
  } catch (err) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error('ML callback error:', msg);
    res.redirect(`${frontendUrl}/?error=${encodeURIComponent('login_failed')}`);
  }
});

// Troca o code de uso unico pelo JWT. O code e apagado na troca (uso unico).
router.post('/exchange', async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código ausente' });
  }
  const entry = await AuthCode.findOneAndDelete({ _id: code });
  if (!entry) {
    return res.status(410).json({ error: 'Código expirado ou já utilizado. Faça login novamente.' });
  }
  const token = signSessionToken(entry.userId, entry.mlUserId);
  res.json({ token, userId: String(entry.userId), userName: entry.userName });
});

// Perfil do usuario — resposta enxuta (allowlist), sem dump do perfil ML.
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email ml_user_id ml_nickname ml_access_token');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    let mlProfile = null;
    try {
      mlProfile = await ml.getUser(user.ml_access_token);
    } catch {}

    const canSell = mlProfile?.status?.sell?.allow === true;
    const isSeller = canSell && !!mlProfile?.seller_experience;

    res.json({
      name: user.name,
      email: user.email,
      ml_user_id: user.ml_user_id,
      ml_nickname: mlProfile?.nickname || user.ml_nickname || null,
      ml_seller: isSeller,
      ml_can_sell: canSell,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = { router, authMiddleware };

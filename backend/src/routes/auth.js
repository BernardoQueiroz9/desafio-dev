const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ml = require('../services/mercadolibre');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const STATE_TTL = 5 * 60 * 1000;

const stateStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of stateStore) {
    if (now - entry.createdAt > STATE_TTL) stateStore.delete(key);
  }
}, 60 * 1000);

function getFrontendUrl(req) {
  return process.env.FRONTEND_URL || req.headers.origin || 'https://desafio-dev-two.vercel.app';
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

router.get('/ml/login', (req, res) => {
  const redirectUri = process.env.ML_REDIRECT_URI;
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { createdAt: Date.now() });
  const url = ml.getAuthUrl(redirectUri, state);
  res.redirect(url);
});

router.get('/ml/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;
    const frontendUrl = getFrontendUrl(req);

    const stored = stateStore.get(state);
    stateStore.delete(state);
    if (!stored) {
      return res.redirect(`${frontendUrl}/?error=invalid_state`);
    }

    if (error || !code) {
      return res.redirect(`${frontendUrl}/?error=${error || 'no_code'}`);
    }

    const redirectUri = process.env.ML_REDIRECT_URI;
    const tokenData = await ml.exchangeCode(code, redirectUri);
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

    const jwtToken = jwt.sign(
      { userId: user._id.toString(), mlUserId: String(user_id) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(
      `${frontendUrl}/?token=${jwtToken}&userId=${user._id}&userName=${encodeURIComponent(name)}`
    );
  } catch (err) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error('ML callback error:', msg);
    res.redirect(`${getFrontendUrl(req)}/?error=${encodeURIComponent(msg)}`);
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email ml_user_id ml_access_token ml_token_expires_at');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    let mlProfile = null;
    try {
      mlProfile = await ml.getUser(user.ml_access_token);
    } catch {}

    const canSell = mlProfile?.status?.sell?.allow === true;
    const sellerExperience = mlProfile?.seller_experience;
    const isSeller = canSell && !!sellerExperience;

    res.json({
      name: user.name,
      email: user.email,
      ml_user_id: user.ml_user_id,
      ml_seller: isSeller,
      ml_can_sell: canSell,
      ml_seller_experience: sellerExperience,
      ml_nickname: mlProfile?.nickname || null,
      ml_tags: mlProfile?.tags || [],
      ml_mercadoenvios: mlProfile?.status?.mercadoenvios || null,
      _dump: mlProfile,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = { router, authMiddleware };

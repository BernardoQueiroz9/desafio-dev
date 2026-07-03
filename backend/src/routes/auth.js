const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ml = require('../services/mercadolibre');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
  const state = Math.random().toString(36).slice(2);
  const url = ml.getAuthUrl(redirectUri, state);
  res.redirect(url);
});

router.get('/ml/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect(`${FRONTEND_URL}/?error=${error || 'no_code'}`);
    }

    const redirectUri = process.env.ML_REDIRECT_URI;
    const tokenData = await ml.exchangeCode(code, redirectUri);
    const { access_token, refresh_token, user_id, expires_in } = tokenData;

    const mlUser = await ml.getUser(access_token);
    const email = mlUser.email || '';
    const name = mlUser.first_name || mlUser.nickname || email.split('@')[0] || 'Vendedor';

    let user = await User.findOne({ ml_user_id: String(user_id) });
    if (user) {
      user.ml_access_token = access_token;
      if (refresh_token) user.ml_refresh_token = refresh_token;
      user.ml_token_expires_at = new Date(Date.now() + expires_in * 1000);
      user.name = name;
      if (email) user.email = email;
    } else {
      user = await User.create({
        name,
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
      `${FRONTEND_URL}/?token=${jwtToken}&userId=${user._id}&userName=${encodeURIComponent(name)}`
    );
  } catch (err) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error('ML callback error:', msg);
    res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(msg)}`);
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

    const sellerStatus = mlProfile?.status?.seller_status || null;
    const isSeller = sellerStatus === 'active';
    const isBuyer = mlProfile?.status?.buyer_status === 'active';

    res.json({
      name: user.name,
      email: user.email,
      ml_user_id: user.ml_user_id,
      ml_seller: isSeller,
      ml_seller_status: sellerStatus,
      ml_buyer_status: mlProfile?.status?.buyer_status || null,
      ml_nickname: mlProfile?.nickname || null,
      ml_tags: mlProfile?.tags || [],
      _dump: mlProfile,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = { router, authMiddleware };

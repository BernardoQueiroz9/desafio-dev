const express = require('express');
const ml = require('../services/mercadolibre');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const router = express.Router();

const ML_SITE_ID = process.env.ML_SITE_ID || 'MLB';

async function getValidAccessToken(user) {
  if (user.isTokenExpired() && user.ml_refresh_token) {
    const data = await ml.refreshAccessToken(user.ml_refresh_token);
    user.ml_access_token = data.access_token;
    user.ml_refresh_token = data.refresh_token;
    user.ml_token_expires_at = new Date(Date.now() + data.expires_in * 1000);
    await user.save();
  }
  return user.ml_access_token;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await getValidAccessToken(user);
    const categories = await ml.getCategories(ML_SITE_ID, accessToken);
    res.json(categories);
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('Erro ao buscar categorias:', msg);
    res.status(500).json({ error: 'Erro ao buscar categorias: ' + msg });
  }
});

router.get('/:id/children', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await getValidAccessToken(user);
    const children = await ml.getCategoryChildren(req.params.id, accessToken);
    res.json(children);
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('Erro ao buscar subcategorias:', msg);
    res.status(500).json({ error: 'Erro ao buscar subcategorias: ' + msg });
  }
});

module.exports = router;

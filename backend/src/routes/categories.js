const express = require('express');
const ml = require('../services/mercadolibre');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const { handleReauth } = require('../services/errors');
const config = require('../config/env');
const router = express.Router();

const ML_SITE_ID = config.ml.siteId;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();
    const categories = await ml.getCategories(ML_SITE_ID, accessToken);
    res.json(categories);
  } catch (err) {
    if (handleReauth(res, err)) return;
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('Erro ao buscar categorias:', msg);
    res.status(500).json({ error: 'Erro ao buscar categorias: ' + msg });
  }
});

router.get('/check/:categoryId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();

    const listingType = await ml.checkAvailableListingType(accessToken, user.ml_user_id, req.params.categoryId, 'gold_special');
    const compatible = !!listingType;
    const hasShipping = compatible ? (listingType.shipping_modes?.some(m => ['not_specified', 'custom'].includes(m)) ?? true) : false;

    res.json({ compatible, hasShipping, listingType });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('Erro ao verificar categoria:', msg);
    res.json({ compatible: true, hasShipping: true, error: msg });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();
    const category = await ml.getCategory(accessToken, req.params.id);
    res.json(category);
  } catch (err) {
    if (handleReauth(res, err)) return;
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('Erro ao buscar categoria:', msg);
    res.status(500).json({ error: 'Erro ao buscar categoria: ' + msg });
  }
});

// Regras/limites que o ML impoe para a categoria + o que a conta pode anunciar.
// Alimenta os alertas e bloqueios do formulario, espelhando o site do ML.
router.get('/:id/rules', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();

    const [cat, listingTypes] = await Promise.all([
      ml.getCategory(accessToken, req.params.id),
      ml.getAvailableListingTypes(accessToken, user.ml_user_id, req.params.id).catch(() => []),
    ]);
    const s = cat.settings || {};
    const availableTypes = listingTypes
      .map(t => t.id || t.listing_type_id)
      .filter(Boolean);

    res.json({
      name: cat.name,
      // Categoria permite anuncio no geral (config da categoria)
      listing_allowed: s.listing_allowed !== false && s.status === 'enabled',
      // A CONTA consegue anunciar nesta categoria agora (especifico do usuario)
      can_list_now: availableTypes.length > 0,
      available_listing_types: availableTypes,
      catalog_domain: s.catalog_domain || null,
      max_title_length: s.max_title_length || 60,
      max_pictures: s.max_pictures_per_item || 6,
      min_price: s.minimum_price ?? 0,
      max_price: s.maximum_price ?? null,
      item_conditions: s.item_conditions || [],
      immediate_payment: s.immediate_payment || null,
      status: s.status || null,
    });
  } catch (err) {
    if (handleReauth(res, err)) return;
    const msg = err.response?.data?.message || err.message;
    console.error('Erro ao buscar regras da categoria:', msg);
    res.status(500).json({ error: 'Erro ao buscar regras da categoria' });
  }
});

// Atributos obrigatorios da categoria para o formulario dinamico.
router.get('/:id/required-attributes', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();
    const attrs = await ml.getRequiredAttributesSchema(accessToken, req.params.id);
    res.json(attrs);
  } catch (err) {
    if (handleReauth(res, err)) return;
    const msg = err.response?.data?.message || err.message;
    console.error('Erro ao buscar atributos obrigatorios:', msg);
    res.status(500).json({ error: 'Erro ao buscar atributos da categoria' });
  }
});

router.get('/:id/children', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const accessToken = await user.getValidToken();
    const children = await ml.getCategoryChildren(req.params.id, accessToken);
    res.json(children);
  } catch (err) {
    if (handleReauth(res, err)) return;
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('Erro ao buscar subcategorias:', msg);
    res.status(500).json({ error: 'Erro ao buscar subcategorias: ' + msg });
  }
});

module.exports = router;

const express = require('express');
const ml = require('../services/mercadolibre');
const router = express.Router();

const ML_SITE_ID = process.env.ML_SITE_ID || 'MLB';

router.get('/', async (req, res) => {
  try {
    const categories = await ml.getCategories(ML_SITE_ID);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

router.get('/:id/children', async (req, res) => {
  try {
    const children = await ml.getCategoryChildren(req.params.id);
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar subcategorias' });
  }
});

module.exports = router;

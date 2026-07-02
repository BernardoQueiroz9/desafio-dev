const express = require('express');
const axios = require('axios');
const Ad = require('../models/Ad');
const router = express.Router();

const checkAuth = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  req.userId = userId;
  next();
};

const BACKEND_BASE = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

const fetchWithRetry = async (url, data, method = 'post', retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios[method](url, data);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000)); // Espera 1s e tenta de novo
    }
  }
};

router.post('/', checkAuth, async (req, res) => {
  try {
    const { title, price, available_quantity, image } = req.body;

    const mlResponse = await fetchWithRetry(`${BACKEND_BASE}/mock/items`, req.body);
    
    const newAd = new Ad({
      ml_id: mlResponse.data.id,
      title, price, available_quantity, image,
      user: req.userId
    });
    
    await newAd.save();
    res.status(201).json(newAd);
  } catch (error) {
    console.error('Erro ao criar anúncio:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Erro ao criar anúncio' });
  }
});

router.get('/', checkAuth, async (req, res) => {
  try {
    const { minPrice, maxPrice, search, mine } = req.query;
    let filter = {};

    if (mine === 'true') {
      filter.user = req.userId;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const ads = await Ad.find(filter).populate('user', 'name').sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar anúncios' });
  }
});

router.post('/sync', checkAuth, async (req, res) => {
  try {
    const ads = await Ad.find({ user: req.userId });

    const results = await Promise.all(ads.map(async (ad) => {
      try {
        const mlRes = await axios.get(`${BACKEND_BASE}/mock/items/${ad.ml_id}/state`, {
          params: { title: ad.title, price: ad.price, available_quantity: ad.available_quantity },
          timeout: 5000,
        });
        const marketplace = mlRes.data;
        const diff = {};

        if (marketplace.title !== ad.title) diff.title = { local: ad.title, marketplace: marketplace.title };
        if (Number(marketplace.price) !== Number(ad.price)) diff.price = { local: ad.price, marketplace: marketplace.price };
        if (Number(marketplace.available_quantity) !== Number(ad.available_quantity)) {
          diff.available_quantity = { local: ad.available_quantity, marketplace: marketplace.available_quantity };
        }

        return Object.keys(diff).length > 0
          ? { ml_id: ad.ml_id, _id: ad._id, local: ad.toObject(), marketplace, diff }
          : null;
      } catch {
        return null;
      }
    }));

    const divergences = results.filter(Boolean);
    res.json({ divergences, checked: ads.length });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
});

router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { title, price, available_quantity, image } = req.body;
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });

    if (!ad) return res.status(404).json({ error: 'Anúncio não encontrado' });

    await fetchWithRetry(`${BACKEND_BASE}/mock/items/${ad.ml_id}`, req.body, 'put');

    ad.title = title;
    ad.price = price;
    ad.available_quantity = available_quantity;
    if (image !== undefined) ad.image = image;
    await ad.save(); 

    res.json(ad);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ error: 'Conflito: O anúncio foi modificado por outro processo.' });
    }
    console.error('Erro ao atualizar anúncio:', error.message);
    res.status(500).json({ error: error.message || 'Erro ao atualizar' });
  }
});

router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });
    if (!ad) return res.status(404).json({ error: 'Anúncio não encontrado' });
    await Ad.deleteOne({ _id: req.params.id });
    res.json({ message: 'Anúncio removido' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao remover anúncio' });
  }
});

module.exports = router;
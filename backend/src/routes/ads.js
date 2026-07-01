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

    const mlResponse = await fetchWithRetry(`${process.env.BACKEND_URL}/mock/items`, req.body);
    
    const newAd = new Ad({
      ml_id: mlResponse.data.id,
      title, price, available_quantity, image,
      user: req.userId
    });
    
    await newAd.save();
    res.status(201).json(newAd);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar anúncio no marketplace' });
  }
});

router.get('/', checkAuth, async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;
    let filter = { user: req.userId };
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const ads = await Ad.find(filter).sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar anúncios' });
  }
});

router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { title, price, available_quantity, image } = req.body;
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });

    if (!ad) return res.status(404).json({ error: 'Anúncio não encontrado' });

    await fetchWithRetry(`${process.env.BACKEND_URL}/mock/items/${ad.ml_id}`, req.body, 'put');

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
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

module.exports = router;
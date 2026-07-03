const express = require('express');
const User = require('../models/User');
const Ad = require('../models/Ad');
const ml = require('../services/mercadolibre');
const { authMiddleware } = require('./auth');
const router = express.Router();

const ML_SITE_ID = process.env.ML_SITE_ID || 'MLB';

async function getValidToken(user) {
  if (user.isTokenExpired()) {
    if (!user.ml_refresh_token) {
      throw new Error('Token expirado e sem refresh_token. Faça login novamente.');
    }
    const data = await ml.refreshAccessToken(user.ml_refresh_token);
    user.ml_access_token = data.access_token;
    user.ml_refresh_token = data.refresh_token;
    user.ml_token_expires_at = new Date(Date.now() + data.expires_in * 1000);
    await user.save();
  }
  return user.ml_access_token;
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, price, available_quantity, image, description, free_shipping, is_full, category_id } = req.body;

    if (available_quantity < 1) {
      return res.status(400).json({ error: 'Estoque deve ser no minimo 1' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'Categoria é obrigatoria' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await getValidToken(user);

    let pictures = [];
    if (image) {
      try {
        const picData = await ml.uploadPicture(accessToken, image);
        pictures = picData.variants
          ? [{ source: picData.variants[0]?.url || image }]
          : [{ source: image }];
      } catch (picErr) {
        console.error('Upload de imagem falhou, continuando sem imagem:', picErr.response?.data || picErr.message);
      }
    }

    const mlItem = await ml.createItem(accessToken, {
      site_id: ML_SITE_ID,
      title,
      category_id,
      price: Number(price),
      currency_id: 'BRL',
      available_quantity: Number(available_quantity),
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      pictures,
      shipping: {
        free_shipping: !!free_shipping,
        mode: is_full ? 'me2' : 'not_specified',
      },
    });

    if (description) {
      await ml.setDescription(accessToken, mlItem.id, description);
    }

    const newAd = new Ad({
      ml_id: mlItem.id,
      title, price, available_quantity, image, description, free_shipping, is_full,
      category_id,
      user: req.userId,
    });
    await newAd.save();

    res.status(201).json(newAd);
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error('Erro ao criar anuncio:', JSON.stringify(detail));
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Erro ao criar anuncio',
      details: error.response?.data || null,
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
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
    res.status(500).json({ error: 'Erro ao listar anuncios' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Anuncio nao encontrado' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar anuncio' });
  }
});

router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const ads = await Ad.find({ user: req.userId });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
    const accessToken = await getValidToken(user);

    const syncResults = await Promise.all(ads.map(async (ad) => {
      if (!ad.ml_id) return null;
      try {
        const mlItem = await ml.getItem(accessToken, ad.ml_id);
        const diff = {};

        if (mlItem.title !== ad.title) diff.title = { local: ad.title, marketplace: mlItem.title };
        if (Number(mlItem.price) !== Number(ad.price)) diff.price = { local: ad.price, marketplace: mlItem.price };
        if (Number(mlItem.available_quantity) !== Number(ad.available_quantity)) {
          diff.available_quantity = { local: ad.available_quantity, marketplace: mlItem.available_quantity };
        }

        return Object.keys(diff).length > 0
          ? { ml_id: ad.ml_id, _id: ad._id, local: ad.toObject(), marketplace: mlItem, diff }
          : null;
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Erro ao consultar ML';
        console.error(`Erro no sync do anúncio ${ad.ml_id}:`, errorMsg);
        return { ml_id: ad.ml_id, _id: ad._id, error: errorMsg };
      }
    }));

    const divergences = syncResults.filter(r => r && !r.error);
    const failed = syncResults.filter(r => r && r.error).map(r => ({ ml_id: r.ml_id, _id: r._id, error: r.error }));
    res.json({ divergences, failed, checked: ads.length });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, price, available_quantity, image, description, free_shipping, is_full } = req.body;
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });

    if (!ad) return res.status(404).json({ error: 'Anuncio nao encontrado' });

    if (available_quantity < 1) {
      return res.status(400).json({ error: 'Estoque deve ser no minimo 1' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await getValidToken(user);

    await ml.updateItem(accessToken, ad.ml_id, {
      title,
      price: Number(price),
      available_quantity: Number(available_quantity),
    });

    if (description) {
      try {
        await ml.setDescription(accessToken, ad.ml_id, description);
      } catch {}
    }

    ad.title = title;
    ad.price = price;
    ad.available_quantity = available_quantity;
    if (image !== undefined) ad.image = image;
    if (description !== undefined) ad.description = description;
    if (free_shipping !== undefined) ad.free_shipping = free_shipping;
    if (is_full !== undefined) ad.is_full = is_full;
    await ad.save();

    res.json(ad);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ error: 'Conflito: O anuncio foi modificado por outro processo.' });
    }
    console.error('Erro ao atualizar anuncio:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message || 'Erro ao atualizar' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });
    if (!ad) return res.status(404).json({ error: 'Anuncio nao encontrado' });
    await Ad.deleteOne({ _id: req.params.id });
    res.json({ message: 'Anuncio removido' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao remover anuncio' });
  }
});

module.exports = router;

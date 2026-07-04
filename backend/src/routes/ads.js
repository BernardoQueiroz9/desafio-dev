const express = require('express');
const User = require('../models/User');
const Ad = require('../models/Ad');
const ml = require('../services/mercadolibre');
const { authMiddleware } = require('./auth');
const router = express.Router();

const ML_SITE_ID = process.env.ML_SITE_ID || 'MLB';
const LISTING_TYPE = 'gold_special';

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, price, available_quantity, images, description, category_id, attributes, free_shipping, is_full } = req.body;

    if (available_quantity == null || available_quantity < 1 || isNaN(Number(available_quantity))) {
      return res.status(400).json({ error: 'Estoque deve ser no minimo 1' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'Categoria é obrigatoria' });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos uma imagem para o anúncio' });
    }
    if (images.length > 5) {
      return res.status(400).json({ error: 'Máximo de 5 imagens por anúncio' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Titulo é obrigatorio' });
    }
    if (title.length > 60) {
      return res.status(400).json({ error: 'Titulo deve ter no maximo 60 caracteres' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await user.getValidToken();

    const availableType = await ml.checkAvailableListingType(accessToken, user.ml_user_id, category_id, LISTING_TYPE);
    if (!availableType) {
      return res.status(400).json({ error: 'O tipo de anúncio gold_special não está disponível para esta categoria ou sua conta. Tente uma categoria diferente.' });
    }

    let pictures = [];
    for (const img of images) {
      const picData = await ml.uploadPicture(accessToken, img);
      if (picData && picData.source) {
        pictures.push(picData);
      }
    }
    if (pictures.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem pôde ser enviada ao Mercado Livre. Verifique o formato e tente novamente.' });
    }
    if (pictures.length !== images.length) {
      return res.status(400).json({ error: `${pictures.length} de ${images.length} imagens foram enviadas. Todas as imagens precisam ser válidas.` });
    }

    let itemAttributes = attributes || [];
    if (itemAttributes.length === 0) {
      const reqAttrs = await ml.getCategoryRequiredAttributes(accessToken, category_id);
      for (const attr of reqAttrs) {
        if (attr.id === 'ITEM_CONDITION') continue;
        if (attr.value_type === 'list' && attr._picked_value_id) {
          itemAttributes.push({ id: attr.id, value_id: attr._picked_value_id });
        } else if (attr._picked_value) {
          itemAttributes.push({ id: attr.id, value_name: attr._picked_value });
        }
      }
      if (itemAttributes.length === 0) {
        return res.status(400).json({ error: 'Não foi possível determinar os atributos obrigatórios para esta categoria.' });
      }
    }

    let saleTerms = [];
    try {
      saleTerms = await ml.getCategorySaleTerms(accessToken, category_id);
    } catch (saleErr) {
      console.error('Falha ao buscar sale_terms:', saleErr.message);
    }

    const shipping = {
      mode: free_shipping ? 'me2' : 'not_specified',
      free_shipping: !!free_shipping,
      local_pick_up: false,
    };

    const basePayload = {
      site_id: ML_SITE_ID,
      title,
      category_id,
      price: Number(price),
      currency_id: 'BRL',
      available_quantity: Number(available_quantity),
      buying_mode: 'buy_it_now',
      listing_type_id: LISTING_TYPE,
      condition: 'new',
      pictures,
      shipping,
    };

    if (itemAttributes.length > 0) {
      basePayload.attributes = itemAttributes;
    }
    if (saleTerms.length > 0) {
      basePayload.sale_terms = saleTerms;
    }

    const validationErrors = await ml.validateItem(accessToken, basePayload);
    if (validationErrors) {
      return res.status(400).json({
        error: 'Validação do Mercado Livre falhou',
        details: validationErrors,
      });
    }

    const createPayload = {
      ...basePayload,
      seller_custom_field: `app_${user._id}_${Date.now()}`,
    };
    const mlItem = await ml.createItem(accessToken, createPayload);

    let descriptionError = null;
    if (description) {
      try {
        await ml.setDescription(accessToken, mlItem.id, description);
      } catch (descErr) {
        descriptionError = descErr.message;
        console.error('Erro ao definir descricao no ML:', descErr.message);
      }
    }

    const savedImages = pictures.map(p => p.source);
    let categoryName = '';
    try {
      const catData = await ml.getCategory(accessToken, category_id);
      categoryName = catData.name || '';
    } catch {}
    const newAd = new Ad({
      ml_id: mlItem.id,
      title, price: Number(price), available_quantity: Number(available_quantity), description,
      image: savedImages[0] || '', images: savedImages,
      category_id, category_name: categoryName, free_shipping, is_full,
      user: req.userId,
    });
    await newAd.save();

    const response = newAd.toObject();
    if (descriptionError) {
      response.description_warning = 'Anúncio criado, mas a descrição não pôde ser salva no Mercado Livre: ' + descriptionError;
    }
    res.status(201).json(response);
  } catch (error) {
    const errData = error.response?.data || {};
    const errMsg = error.response ? JSON.stringify(errData, null, 2) : error.message;
    console.error('Erro ao criar anuncio:', errMsg);
    const userMsg = ml.mapMlError(errData);
    const statusCode = error.response?.status || 500;
    res.status(statusCode >= 400 && statusCode < 500 ? statusCode : 500).json({
      error: userMsg,
      details: Object.keys(errData).length > 0 ? errData : undefined,
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

    const ads = await Ad.find(filter).populate('user', 'name ml_nickname').sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar anuncios' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('user', 'name ml_nickname');
    if (!ad) return res.status(404).json({ error: 'Anuncio nao encontrado' });
    if (ad.category_id && !ad.category_name) {
      try {
        const user = await User.findById(req.userId);
        if (user) {
          const token = await user.getValidToken();
          const catData = await ml.getCategory(token, ad.category_id);
          ad.category_name = catData.name || '';
        }
      } catch {}
    }
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
    const accessToken = await user.getValidToken();

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
    const { title, price, available_quantity, images, description, free_shipping, is_full } = req.body;
    const ad = await Ad.findOne({ _id: req.params.id, user: req.userId });

    if (!ad) return res.status(404).json({ error: 'Anuncio nao encontrado' });

    if (available_quantity == null || available_quantity < 1 || isNaN(Number(available_quantity))) {
      return res.status(400).json({ error: 'Estoque deve ser no minimo 1' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await user.getValidToken();

    const updatePayload = {
      title,
      price: Number(price),
      available_quantity: Number(available_quantity),
    };
    if (free_shipping !== undefined) {
      updatePayload.shipping = {
        mode: free_shipping ? 'me2' : 'not_specified',
        free_shipping: !!free_shipping,
      };
    }
    await ml.updateItem(accessToken, ad.ml_id, updatePayload);

    if (description) {
      try {
        await ml.setDescription(accessToken, ad.ml_id, description);
      } catch {}
    }

    ad.title = title;
    ad.price = price;
    ad.available_quantity = available_quantity;
    if (images !== undefined) {
      ad.images = images;
      ad.image = images[0] || '';
    }
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

    if (ad.ml_id) {
      try {
        const user = await User.findById(req.userId);
        if (user) {
          const accessToken = await user.getValidToken();
          await ml.updateItem(accessToken, ad.ml_id, { status: 'closed' });
        }
      } catch (mlErr) {
        console.error('Erro ao fechar anúncio no ML:', mlErr.message);
      }
    }

    await Ad.deleteOne({ _id: req.params.id });
    res.json({ message: 'Anuncio removido' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao remover anuncio' });
  }
});

module.exports = router;

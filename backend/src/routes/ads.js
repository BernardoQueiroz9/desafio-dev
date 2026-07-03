const express = require('express');
const User = require('../models/User');
const Ad = require('../models/Ad');
const ml = require('../services/mercadolibre');
const { authMiddleware } = require('./auth');
const router = express.Router();

const ML_SITE_ID = process.env.ML_SITE_ID || 'MLB';
const LISTING_TYPE = 'gold_special';

const DEFAULT_ATTRIBUTES = {
  BRAND: 'Genérico',
  COLLECTION: 'Standard',
  FORMAT: 'Padrão',
  VIDEO_GAME_PLATFORM: 'PC',
  VIDEO_GAME_TITLE: 'Jogo Padrão',
  REGION: 'Nacional',
  US_GAME_CLASSIFICATION: 'E (Everyone)',
  LINE: 'Básica',
  DEPARTMENT: 'Geral',
  COLOR: 'Preto',
  SIZE: 'M',
  MATERIAL: 'Padrão',
  MODEL: 'Básico',
};

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
    const { title, price, available_quantity, image, description, category_id, attributes } = req.body;

    if (available_quantity < 1) {
      return res.status(400).json({ error: 'Estoque deve ser no minimo 1' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'Categoria é obrigatoria' });
    }
    if (!image) {
      return res.status(400).json({ error: 'Selecione uma imagem para o anúncio' });
    }
    if (!title || title.length < 10) {
      return res.status(400).json({ error: 'Título deve ter pelo menos 10 caracteres' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await getValidToken(user);

    let pictures;
    try {
      const picData = await ml.uploadPicture(accessToken, image);
      console.error('ML upload response:', JSON.stringify(picData).slice(0, 500));
      const pictureUrl = picData?.variants?.[0]?.url || picData?.secure_url || picData?.url;
      if (pictureUrl) {
        pictures = [{ source: pictureUrl }];
      }
    } catch (uploadErr) {
      console.error('Upload falhou, usando placeholder:', uploadErr.message);
    }
    if (!pictures) {
      pictures = [{ source: 'https://placehold.co/400x400/FFF/EEE?text=Produto' }];
    }

    let itemAttributes = attributes || [];
    if (itemAttributes.length === 0) {
      try {
        const reqAttrs = await ml.getCategoryRequiredAttributes(accessToken, category_id);
        for (const attr of reqAttrs) {
          const id = attr.id;
          const value = attr.default_value?.value || DEFAULT_ATTRIBUTES[id] || '';
          if (value) {
            itemAttributes.push({ id, value_name: value });
          }
        }
      } catch {}
    }

    try {
      const availableType = await ml.checkAvailableListingType(accessToken, user.ml_user_id || user.ml_id, category_id, LISTING_TYPE);
      if (availableType === null) {
        console.error('API retornou que listing type não disponível para esta categoria');
      } else {
        const hasValidShipping = availableType.shipping_modes?.some(m => ['not_specified', 'custom'].includes(m));
        if (!hasValidShipping) {
          return res.status(400).json({
            error: 'Esta categoria exige frete Mercado Livre (não disponível pra sua conta). Escolha "Roupas", "Brinquedos" ou "Ferramentas".',
          });
        }
      }
    } catch (checkErr) {
      console.error('Falha ao verificar listing type (continuando):', checkErr.message);
    }

    const payload = {
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
    };

    if (itemAttributes.length > 0) {
      payload.attributes = itemAttributes;
    }

    const mlItem = await ml.createItem(accessToken, payload);

    if (description) {
      try { await ml.setDescription(accessToken, mlItem.id, description); } catch {}
    }

    const newAd = new Ad({
      ml_id: mlItem.id,
      title, price: Number(price), available_quantity: Number(available_quantity), image, description,
      category_id,
      user: req.userId,
    });
    await newAd.save();

    res.status(201).json(newAd);
  } catch (error) {
    const errData = error.response?.data || {};
    console.error('Erro ao criar anuncio:', JSON.stringify(errData, null, 2));
    const cause = (errData.cause || []).map(c => typeof c === 'string' ? c : (c.message || ''));
    if (cause.length) {
      cause.forEach((c, i) => console.error(`  cause[${i}]:`, c));
    }
    let userMsg = errData.message || error.message || 'Erro ao criar anuncio';
    if (cause.some(c => c.includes('mode me1') || c.includes('mandatory free shipping'))) {
      userMsg = 'Sua conta ainda não pode usar frete do Mercado Livre. Escolha uma categoria que não exija frete, como "Roupas", "Brinquedos", "Ferramentas" ou "Papelaria".';
    } else if (cause.some(c => c.includes('Maximum length'))) {
      userMsg = 'A imagem selecionada é muito grande ou inválida. Tente outra imagem.';
    } else if (cause.some(c => c.includes('attributes') && c.includes('required'))) {
      userMsg = `Esta categoria exige atributos específicos. Tente "Roupas", "Brinquedos" ou "Ferramentas" que são mais simples.`;
    }
    res.status(500).json({
      error: userMsg,
      details: errData,
    });
  }
});

router.post('/test-create', authMiddleware, async (req, res) => {
  try {
    const { title, price, available_quantity, category_id } = req.body;
    if (!title || !price || !available_quantity || !category_id) {
      return res.status(400).json({ error: 'title, price, available_quantity e category_id sao obrigatorios' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const accessToken = await getValidToken(user);

    const payload = {
      site_id: ML_SITE_ID,
      title,
      category_id,
      price: Number(price),
      currency_id: 'BRL',
      available_quantity: Number(available_quantity),
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
    };

    console.log('Test-create payload:', JSON.stringify(payload, null, 2));
    const mlItem = await ml.createItem(accessToken, payload);

    const newAd = new Ad({
      ml_id: mlItem.id,
      title, price, available_quantity, category_id,
      user: req.userId,
    });
    await newAd.save();

    res.status(201).json({ message: 'Anuncio criado com sucesso!', ad: newAd, mlItem });
  } catch (error) {
    const errData = error.response?.data || {};
    console.error('Erro no test-create:', JSON.stringify(errData, null, 2));
    const cause = errData.cause || [];
    if (cause.length) {
      cause.forEach((c, i) => console.error(`  cause[${i}]:`, JSON.stringify(c)));
    }
    res.status(500).json({
      error: errData.message || error.message || 'Erro ao criar anuncio de teste',
      details: errData,
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

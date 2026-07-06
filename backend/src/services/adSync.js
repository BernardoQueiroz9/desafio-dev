const Ad = require('../models/Ad');
const ml = require('./mercadolibre');

// Aplica o estado de um item do ML no registro local. Retorna 'removed',
// 'updated' ou 'unchanged'. 'closed'/'inactive' => remove o registro local.
async function applyItemToAd(ad, item) {
  if (item.status === 'closed' || item.status === 'inactive') {
    await Ad.deleteOne({ _id: ad._id });
    return 'removed';
  }
  let changed = false;
  if (item.title != null && item.title !== ad.title) { ad.title = item.title; changed = true; }
  if (item.price != null && Number(item.price) !== Number(ad.price)) { ad.price = item.price; changed = true; }
  if (item.available_quantity != null && Number(item.available_quantity) !== Number(ad.available_quantity)) {
    ad.available_quantity = item.available_quantity; changed = true;
  }
  if (changed) { await ad.save(); return 'updated'; }
  return 'unchanged';
}

// Sincroniza TODOS os anuncios do usuario com o estado atual do ML.
async function applyMlStateToLocalAds(userId, accessToken) {
  const ads = await Ad.find({ user: userId });
  let updated = 0, removed = 0;
  for (const ad of ads) {
    if (!ad.ml_id) continue;
    try {
      const item = await ml.getItem(accessToken, ad.ml_id);
      const r = await applyItemToAd(ad, item);
      if (r === 'updated') updated++;
      else if (r === 'removed') removed++;
    } catch (err) {
      // 404 definitivo = item nao existe mais no ML -> remove local.
      // Erros transitorios (rede/rate limit) NAO removem nada.
      if (err.response?.status === 404) { await Ad.deleteOne({ _id: ad._id }); removed++; }
    }
  }
  return { updated, removed, checked: ads.length };
}

// Sincroniza UM anuncio (por ml_id) — usado pelos webhooks de notificacao.
async function syncSingleAdByMlId(mlId, accessToken) {
  const ad = await Ad.findOne({ ml_id: mlId });
  if (!ad) return 'not_found';
  try {
    const item = await ml.getItem(accessToken, mlId);
    return await applyItemToAd(ad, item);
  } catch (err) {
    if (err.response?.status === 404) { await Ad.deleteOne({ _id: ad._id }); return 'removed'; }
    throw err;
  }
}

module.exports = { applyMlStateToLocalAds, syncSingleAdByMlId };

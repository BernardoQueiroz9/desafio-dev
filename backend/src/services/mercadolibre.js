const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_BASE = 'https://api.mercadolibre.com';
const AUTH_BASE = 'https://auth.mercadolivre.com.br';

async function callWithRetry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNetworkError = !err.response && err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED';
      const isServerError = err.response && err.response.status >= 500;
      const isRateLimit = err.response && err.response.status === 429;
      if ((isNetworkError || isServerError || isRateLimit) && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

function getAuthUrl(redirectUri, state, codeChallenge) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ML_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'offline_access read write',
  });
  if (state) params.set('state', state);
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }
  return `${AUTH_BASE}/authorization?${params.toString()}`;
}

async function exchangeCode(code, redirectUri, codeVerifier) {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.ML_CLIENT_ID);
  params.append('client_secret', process.env.ML_CLIENT_SECRET);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  if (codeVerifier) params.append('code_verifier', codeVerifier);

  return callWithRetry(async () => {
    const res = await axios.post(`${API_BASE}/oauth/token`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  });
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.ML_CLIENT_ID);
  params.append('client_secret', process.env.ML_CLIENT_SECRET);
  params.append('refresh_token', refreshToken);

  return callWithRetry(async () => {
    const res = await axios.post(`${API_BASE}/oauth/token`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  });
}

async function getUser(accessToken) {
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/users/me`, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  });
}

const BASE_HEADERS = {
  'User-Agent': 'DesafioML/1.0',
  'Accept': 'application/json',
};

async function getCategories(siteId, accessToken) {
  const headers = { ...BASE_HEADERS };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/sites/${siteId}/categories`, { headers });
    return res.data;
  });
}

async function getCategoryChildren(categoryId, accessToken) {
  const headers = { ...BASE_HEADERS };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/categories/${categoryId}`, { headers });
    return res.data.children_categories || [];
  });
}

async function uploadPicture(accessToken, imageDataUrl) {
  const matches = imageDataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!matches) throw new Error('Formato de imagem invalido');
  const buffer = Buffer.from(matches[2], 'base64');
  const ext = matches[1].split('/')[1] || 'jpg';
  const tmpFile = path.join(os.tmpdir(), `meli_${Date.now()}.${ext}`);
  fs.writeFileSync(tmpFile, buffer);

  try {
    return await callWithRetry(async () => {
      const form = new FormData();
      form.append('file', fs.createReadStream(tmpFile));

      const headers = {
        ...BASE_HEADERS,
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      };

      const res = await axios.post(`${API_BASE}/pictures`, form, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const data = res.data;
      if (data && data.id) {
        data.secure_url = `https://http2.mlstatic.com/storage/pictures/${data.id}`;
      }
      return data;
    });
  } catch (err) {
    console.error('uploadPicture error:', err.response?.data || err.message);
    throw err;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

async function createItem(accessToken, data) {
  return callWithRetry(async () => {
    const res = await axios.post(`${API_BASE}/items`, data, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return res.data;
  });
}

async function updateItem(accessToken, itemId, data) {
  return callWithRetry(async () => {
    const res = await axios.put(`${API_BASE}/items/${itemId}`, data, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return res.data;
  });
}

async function getItem(accessToken, itemId) {
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/items/${itemId}`, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  });
}

async function getCategoryRequiredAttributes(accessToken, categoryId) {
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/categories/${categoryId}/attributes`, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` },
    });
    const all = Array.isArray(res.data) ? res.data : [];
    return all
      .filter(attr => attr.tags?.required || attr.tags?.catalog_required || attr.tags?.new_required)
      .map(attr => {
        let value_id = null;
        let value_name = '';
        if (attr.value_type === 'list') {
          const first = attr.allowed_values?.[0] || attr.values?.[0];
          if (first) {
            value_id = first.id;
            value_name = first.name || '';
          }
        } else {
          value_name = attr.default_value?.value || attr.values?.[0]?.name || attr.values?.[0]?.id || '';
        }
        return {
          id: attr.id,
          name: attr.name,
          value_type: attr.value_type,
          tags: attr.tags,
          relevance: attr.relevance,
          _picked_value_id: value_id,
          _picked_value: value_name,
        };
      });
  });
}

async function checkAvailableListingType(accessToken, userId, categoryId, listingTypeId) {
  const res = await callWithRetry(async () => {
    return await axios.get(
      `${API_BASE}/users/${userId}/available_listing_types`,
      { params: { category: categoryId }, headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` } }
    );
  });
  const types = Array.isArray(res.data) ? res.data : (res.data.available_listing_types || []);
  console.error('available_listing_types response:', JSON.stringify(types).slice(0, 800));
  return types.find(t => (t.id || t.listing_type_id) === listingTypeId) || null;
}

async function getCategory(accessToken, categoryId) {
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/categories/${categoryId}`, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  });
}

async function validateItem(accessToken, payload) {
  return callWithRetry(async () => {
    const res = await axios.post(`${API_BASE}/items/validate`, payload, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      validateStatus: status => status === 204 || status === 400,
    });
    if (res.status === 204) return null;
    return res.data;
  });
}

async function getCategorySaleTerms(accessToken, categoryId) {
  return callWithRetry(async () => {
    const res = await axios.get(`${API_BASE}/categories/${categoryId}/attributes`, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}` },
    });
    const all = Array.isArray(res.data) ? res.data : [];
    return all
      .filter(attr => (attr.tags?.required || attr.tags?.catalog_required) && attr.id.includes('WARRANTY'))
      .map(attr => ({
        id: attr.id,
        value_name: attr.allowed_values?.[0]?.name || attr.values?.[0]?.name || '90 días',
      }));
  });
}

const SELLER_ERROR_MAP = {
  'seller.unable_to_list': {
    address_pending: 'Seu cadastro de vendedor no Mercado Livre está incompleto. Acesse sua conta no ML em "Vender" e complete seu endereço, telefone e documentos. Depois crie um anúncio manualmente no site do ML para liberar sua conta.',
    identification_pending: 'Seu documento está pendente de verificação no Mercado Livre. Acesse sua conta e complete a verificação de identidade.',
    rejected_by_regulations: 'Sua conta foi rejeitada pelas políticas do Mercado Livre. Entre em contato com o suporte do ML.',
    address_empty_city: 'Sua cidade não está preenchida no cadastro do Mercado Livre. Complete seu endereço nas configurações da conta.',
    address_empty_state: 'Seu estado não está preenchido no cadastro do Mercado Livre. Complete seu endereço nas configurações da conta.',
    phone_pending: 'Seu telefone não está confirmado no Mercado Livre. Adicione um telefone válido nas configurações da conta.',
  },
};

function mapMlError(errData) {
  const errorCode = errData.error;
  const causes = (errData.cause || []).map(c => typeof c === 'string' ? c : c.code || c.message || '');
  const errorMap = SELLER_ERROR_MAP[errorCode];
  if (errorMap) {
    for (const cause of causes) {
      if (errorMap[cause]) return errorMap[cause];
    }
  }
  const causeStr = causes.filter(Boolean).join('; ');
  if (causeStr) {
    return (errData.message || 'Erro do Mercado Livre') + ' (' + causeStr + ')';
  }
  return errData.message || 'Erro desconhecido do Mercado Livre';
}

async function setDescription(accessToken, itemId, plainText) {
  return callWithRetry(async () => {
    const res = await axios.post(
      `${API_BASE}/items/${itemId}/description`,
      { plain_text: plainText },
      { headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
  });
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getUser,
  getCategories,
  getCategoryChildren,
  uploadPicture,
  createItem,
  updateItem,
  getItem,
  setDescription,
  getCategoryRequiredAttributes,
  checkAvailableListingType,
  getCategory,
  validateItem,
  getCategorySaleTerms,
  mapMlError,
};

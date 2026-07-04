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

  try {
    fs.writeFileSync(tmpFile, buffer);
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
      if (data && data.variants?.[0]?.url) {
        return { source: data.variants[0].url };
      }
      if (data && data.secure_url) {
        return { source: data.secure_url };
      }
      if (data && data.url) {
        return { source: data.url };
      }
      throw new Error('Resposta da API de imagens sem URL');
    });
  } catch (err) {
    console.error('uploadPicture error:', err.response?.data || err.message);
    throw err;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

async function createItem(accessToken, data) {
  // retries=1: a criacao NAO e reexecutada em falha de rede. Um timeout apos o
  // ML ja ter criado o item duplicaria o anuncio no marketplace. A idempotencia
  // fica a cargo do guard por idempotency_key no banco (routes/ads.js).
  return callWithRetry(async () => {
    const res = await axios.post(`${API_BASE}/items`, data, {
      headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return res.data;
  }, 1);
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
      validateStatus: status => [200, 204, 400, 422].includes(status),
    });
    if (res.status === 200 || res.status === 204) return null;
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

// Padroes de mensagem/cause do ML mapeados para orientacoes acionaveis em pt-BR.
// Cada entrada testa o texto agregado (error + causes + message) em minusculas.
const GENERIC_PATTERNS = [
  { match: /listing_type|available_listing_type|not.*allowed.*category|gold_special/, msg: 'Esta categoria não aceita o tipo de anúncio Clássico para a sua conta. Escolha outra categoria.' },
  { match: /pictures|imagem|image|picture/, msg: 'Uma das imagens foi rejeitada pelo Mercado Livre (formato ou tamanho). Envie outra imagem.' },
  { match: /attribute|atributo|required.*value|value.*required/, msg: 'Um atributo obrigatório da categoria está ausente ou inválido. Revise os dados do anúncio.' },
  { match: /price|preço|precio/, msg: 'Preço inválido. Informe um valor maior que zero.' },
  { match: /quantity|estoque|available_quantity/, msg: 'Estoque inválido. Informe uma quantidade de pelo menos 1.' },
  { match: /title|título|titulo/, msg: 'Título inválido. Verifique o texto (máximo de 60 caracteres).' },
  { match: /shipping|frete|envio|me2/, msg: 'Configuração de frete inválida para esta categoria. Tente sem frete grátis.' },
];

function mapMlError(errData) {
  if (!errData || Object.keys(errData).length === 0) return 'Erro de conexão com o Mercado Livre. Verifique sua rede e tente novamente.';
  const errorCode = errData.error;
  const causes = (errData.cause || []).map(c => typeof c === 'string' ? c : c.code || c.message || '');

  // 1) Mapa curado de erros de vendedor (cadastro incompleto etc.)
  const errorMap = SELLER_ERROR_MAP[errorCode];
  if (errorMap) {
    for (const cause of causes) {
      if (errorMap[cause]) return errorMap[cause];
    }
  }

  // 2) Padroes gerais por palavra-chave no conteudo agregado do erro.
  const haystack = [errorCode, errData.message, ...causes].filter(Boolean).join(' ').toLowerCase();
  for (const { match, msg } of GENERIC_PATTERNS) {
    if (match.test(haystack)) return msg;
  }

  // 3) Fallback: mensagem do ML + causas, sem vazar payload tecnico bruto.
  const causeStr = causes.filter(Boolean).join('; ');
  if (causeStr) {
    return (errData.message || 'O Mercado Livre recusou o anúncio') + ' (' + causeStr + ')';
  }
  return errData.message || 'Não foi possível publicar o anúncio no Mercado Livre. Revise os dados e tente novamente.';
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

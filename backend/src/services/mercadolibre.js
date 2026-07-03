const axios = require('axios');

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

function getAuthUrl(redirectUri, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ML_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read write offline_access',
  });
  if (state) params.set('state', state);
  return `${AUTH_BASE}/authorization?${params.toString()}`;
}

async function exchangeCode(code, redirectUri) {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.ML_CLIENT_ID);
  params.append('client_secret', process.env.ML_CLIENT_SECRET);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

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

async function uploadPicture(accessToken, imageBase64) {
  return callWithRetry(async () => {
    const res = await axios.post(
      `${API_BASE}/pictures`,
      { source: imageBase64 },
      { headers: { ...BASE_HEADERS, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
  });
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
};

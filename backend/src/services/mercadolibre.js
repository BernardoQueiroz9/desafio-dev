const axios = require('axios');

const API_BASE = 'https://api.mercadolibre.com';
const AUTH_BASE = 'https://auth.mercadolivre.com.br';

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

  const res = await axios.post(`${API_BASE}/oauth/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.ML_CLIENT_ID);
  params.append('client_secret', process.env.ML_CLIENT_SECRET);
  params.append('refresh_token', refreshToken);

  const res = await axios.post(`${API_BASE}/oauth/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

async function getUser(accessToken) {
  const res = await axios.get(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

async function getCategories(siteId) {
  const res = await axios.get(`${API_BASE}/sites/${siteId}/categories`);
  return res.data;
}

async function getCategoryChildren(categoryId) {
  const res = await axios.get(`${API_BASE}/categories/${categoryId}`);
  return res.data.children_categories || [];
}

async function uploadPicture(accessToken, imageBase64) {
  const res = await axios.post(
    `${API_BASE}/pictures`,
    { source: imageBase64 },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

async function createItem(accessToken, data) {
  const res = await axios.post(`${API_BASE}/items`, data, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

async function updateItem(accessToken, itemId, data) {
  const res = await axios.put(`${API_BASE}/items/${itemId}`, data, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

async function getItem(accessToken, itemId) {
  const res = await axios.get(`${API_BASE}/items/${itemId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

async function setDescription(accessToken, itemId, plainText) {
  const res = await axios.post(
    `${API_BASE}/items/${itemId}/description`,
    { plain_text: plainText },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
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

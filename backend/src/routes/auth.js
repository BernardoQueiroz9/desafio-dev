const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

router.get('/login', (req, res) => {
  const redirectUri = `${process.env.BACKEND_URL}/api/auth/callback`;
  res.redirect(`${process.env.BACKEND_URL}/mock/authorization?redirect_uri=${redirectUri}`);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const mlResponse = await axios.post(`${process.env.BACKEND_URL}/mock/oauth/token`, { code });
    const { access_token, refresh_token, user_id } = mlResponse.data;

    // Salva ou atualiza o usuário no MongoDB
    let user = await User.findOneAndUpdate(
      { ml_user_id: user_id },
      { access_token, refresh_token },
      { upsert: true, new: true }
    );

    // Redireciona para o frontend passando o ID do usuário (como um token simples de sessão)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?userId=${user._id}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/authorization', (req, res) => {
  const { redirect_uri } = req.query;
  const mockCode = "MOCK_AUTH_CODE_" + Date.now();
  res.send(`
    <div style="text-align:center; padding: 50px; font-family: sans-serif;">
      <h2>[MOCK] Conectar ao Mercado Livre</h2>
      <a href="${redirect_uri}?code=${mockCode}" style="padding: 10px 20px; background: #3483fa; color: white; text-decoration: none; border-radius: 5px;">Autorizar</a>
    </div>
  `);
});

router.post('/oauth/token', (req, res) => {
  res.json({
    access_token: "APP_USR-MOCK-TOKEN-" + Date.now(),
    refresh_token: "TG-MOCK-REFRESH-" + Date.now(),
    user_id: "123456789" // ID fixo do usuário mockado
  });
});

router.post('/items', (req, res) => {
  // Simula uma falha de rede aleatória (Resiliência)
  if (Math.random() < 0.2) return res.status(500).json({ error: "Internal ML Mock Error" });
  
  const { title, price, available_quantity } = req.body;
  res.status(201).json({
    id: "MLB" + Math.floor(Math.random() * 10000000),
    title, price, available_quantity
  });
});

router.put('/items/:id', (req, res) => {
  res.status(200).json({ id: req.params.id, ...req.body });
});

module.exports = router;
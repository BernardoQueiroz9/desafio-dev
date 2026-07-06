const express = require('express');
const User = require('../models/User');
const { syncSingleAdByMlId } = require('../services/adSync');
const router = express.Router();

// Recebe notificacoes do Mercado Livre (topico "items"). O ML espera uma
// resposta 200 rapida, entao respondemos primeiro e processamos em seguida.
router.post('/ml', (req, res) => {
  res.sendStatus(200);
  processNotification(req.body).catch((err) => {
    console.error('Falha ao processar notificacao ML:', err.message);
  });
});

async function processNotification(body) {
  if (!body) return;
  const { topic, resource, user_id } = body;
  // Ex.: { topic: 'items', resource: '/items/MLB123', user_id: 12345 }
  if (topic !== 'items' || !resource) return;

  const mlItemId = String(resource).split('/').filter(Boolean).pop();
  if (!mlItemId) return;

  const user = await User.findOne({ ml_user_id: String(user_id) });
  if (!user) return; // notificacao de um usuario que nao usa o app

  const accessToken = await user.getValidToken();
  const result = await syncSingleAdByMlId(mlItemId, accessToken);
  console.log(`Notificacao ML item ${mlItemId}: ${result}`);
}

module.exports = router;

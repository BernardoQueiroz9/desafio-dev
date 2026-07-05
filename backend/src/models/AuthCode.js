const mongoose = require('mongoose');

/**
 * Codigo de troca de uso unico entregue ao frontend apos o login OAuth.
 * O frontend troca este `code` pelo JWT via POST /api/auth/exchange.
 * Nao persistimos o JWT: guardamos so o minimo e assinamos o token na troca.
 * O indice TTL remove o documento ~60s apos a criacao; a troca tambem o apaga.
 */
const AuthCodeSchema = new mongoose.Schema({
  _id: { type: String }, // o proprio `code` opaco
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mlUserId: { type: String, required: true },
  userName: { type: String, default: '' },
  // 5 min: folga para redes moveis lentas / cold start do backend.
  createdAt: { type: Date, default: Date.now, expires: 300 },
}, { _id: false, versionKey: false });

module.exports = mongoose.model('AuthCode', AuthCodeSchema);

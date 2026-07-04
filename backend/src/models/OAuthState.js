const mongoose = require('mongoose');

/**
 * Estado transitorio do fluxo OAuth (protecao CSRF + verificador PKCE).
 * Substitui o Map em memoria: sobrevive a reinicio/multiplas instancias.
 * O indice TTL remove o documento ~5min apos a criacao.
 */
const OAuthStateSchema = new mongoose.Schema({
  _id: { type: String }, // o proprio `state`
  codeVerifier: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
}, { _id: false, versionKey: false });

module.exports = mongoose.model('OAuthState', OAuthStateSchema);

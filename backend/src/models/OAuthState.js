const mongoose = require('mongoose');

const OAuthStateSchema = new mongoose.Schema({
  _id: { type: String },
  codeVerifier: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
}, { _id: false, versionKey: false });

module.exports = mongoose.model('OAuthState', OAuthStateSchema);

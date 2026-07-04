const mongoose = require('mongoose');
const ml = require('../services/mercadolibre');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ml_nickname: { type: String, default: '' },
  email: { type: String, default: '' },
  ml_user_id: { type: String, required: true, unique: true },
  ml_access_token: { type: String, required: true },
  ml_refresh_token: { type: String, default: '' },
  ml_token_expires_at: { type: Date, required: true },
}, { timestamps: true });

UserSchema.methods.isTokenExpired = function () {
  return Date.now() >= this.ml_token_expires_at.getTime();
};

UserSchema.methods.getValidToken = async function () {
  if (this.isTokenExpired()) {
    if (!this.ml_refresh_token) {
      throw new Error('Token expirado e sem refresh_token. Faça login novamente.');
    }
    const data = await ml.refreshAccessToken(this.ml_refresh_token);
    this.ml_access_token = data.access_token;
    this.ml_refresh_token = data.refresh_token;
    this.ml_token_expires_at = new Date(Date.now() + data.expires_in * 1000);
    await this.save();
  }
  return this.ml_access_token;
};

module.exports = mongoose.model('User', UserSchema);

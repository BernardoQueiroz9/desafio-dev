const mongoose = require('mongoose');
const ml = require('../services/mercadolibre');
const { MlReauthRequired } = require('../services/errors');

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
      throw new MlReauthRequired();
    }
    let data;
    try {
      data = await ml.refreshAccessToken(this.ml_refresh_token);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        throw new MlReauthRequired();
      }
      throw err;
    }
    this.ml_access_token = data.access_token;
    if (data.refresh_token) this.ml_refresh_token = data.refresh_token;
    this.ml_token_expires_at = new Date(Date.now() + data.expires_in * 1000);
    await this.save();
  }
  return this.ml_access_token;
};

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.ml_access_token;
    delete ret.ml_refresh_token;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);

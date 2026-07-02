const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  ml_user_id: { type: String, required: true, unique: true },
  ml_access_token: { type: String, required: true },
  ml_refresh_token: { type: String, required: true },
  ml_token_expires_at: { type: Date, required: true },
}, { timestamps: true });

UserSchema.methods.isTokenExpired = function () {
  return Date.now() >= this.ml_token_expires_at.getTime();
};

module.exports = mongoose.model('User', UserSchema);

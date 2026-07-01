const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  ml_user_id: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);
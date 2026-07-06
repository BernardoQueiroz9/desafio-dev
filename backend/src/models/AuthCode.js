const mongoose = require('mongoose');

const AuthCodeSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mlUserId: { type: String, required: true },
  userName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: 300 },
}, { _id: false, versionKey: false });

module.exports = mongoose.model('AuthCode', AuthCodeSchema);

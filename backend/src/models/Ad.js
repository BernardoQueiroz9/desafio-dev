const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  ml_id: { type: String, required: true, unique: true }, // Evita duplicidade
  title: { type: String, required: true },
  price: { type: Number, required: true },
  available_quantity: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);
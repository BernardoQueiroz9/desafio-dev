const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  ml_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  available_quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  category_id: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AdSchema.index({ user: 1, title: 1 });

module.exports = mongoose.model('Ad', AdSchema);
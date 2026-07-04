const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  ml_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  available_quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  images: [{ type: String }],
  description: { type: String, default: '' },
  free_shipping: { type: Boolean, default: false },
  is_full: { type: Boolean, default: false },
  category_id: { type: String, default: '' },
  category_name: { type: String, default: '' },
  idempotency_key: { type: String, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AdSchema.index({ user: 1, title: 1 });
// Impede anuncios duplicados por retry (sparse: nulls nao conflitam).
AdSchema.index({ user: 1, idempotency_key: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Ad', AdSchema);
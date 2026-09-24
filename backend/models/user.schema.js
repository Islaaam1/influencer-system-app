const mongoose = require('mongoose');

function transformDocument(document, result) {
  result.id = result._id.toString();
  delete result._id;
  delete result.__v;
  return result;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'influencer'], default: 'influencer' },
    promo_code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    discount_rate: { type: Number, default: 10, min: 0, max: 100 },
    commission_rate: { type: Number, default: 10, min: 0, max: 100 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { transform: transformDocument },
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema, 'users');

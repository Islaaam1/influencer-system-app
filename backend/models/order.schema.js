const mongoose = require('mongoose');

function transformDocument(document, result) {
  result.id = result._id.toString();
  delete result._id;
  delete result.__v;
  return result;
}

const orderSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true, trim: true },
    customer_phone: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    products: {
      type: [{
        _id: false,
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        code: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
        subtotal: { type: Number, required: true, min: 0 },
      }],
      validate: {
        validator: (products) => products.length > 0,
        message: 'يجب إضافة منتج واحد على الأقل',
      },
    },
    order_value: { type: Number, required: true, min: 0 },
    promo_code: { type: String, default: null, uppercase: true, trim: true },
    influencer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    discount_amount: { type: Number, default: 0, min: 0 },
    commission_amount: { type: Number, default: 0, min: 0 },
    google_form_synced: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { transform: transformDocument },
  }
);

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders');

const mongoose = require('mongoose');

function transformDocument(document, result) {
  result.id = result._id.toString();
  delete result._id;
  delete result.__v;
  return result;
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { transform: transformDocument },
  }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

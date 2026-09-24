const mongoose = require('mongoose');

function transformDocument(document, result) {
  result.id = result._id.toString();
  delete result._id;
  delete result.__v;
  return result;
}

const commissionPaymentSchema = new mongoose.Schema(
  {
    influencer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: null },
    paid_at: { type: Date, default: Date.now },
  },
  {
    toJSON: { transform: transformDocument },
  }
);

module.exports = mongoose.models.CommissionPayment
  || mongoose.model('CommissionPayment', commissionPaymentSchema, 'commission_payments');

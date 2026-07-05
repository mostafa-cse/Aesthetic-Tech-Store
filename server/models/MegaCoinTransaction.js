const mongoose = require('mongoose');

const megaCoinTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'admin-credit', 'admin-deduct', 'refund-credit', 'refund-deduct'],
      required: true,
    },
    amount: { type: Number, required: true }, // positive for earn/credit, negative for redeem/deduct
    balance: { type: Number, required: true }, // balance AFTER this transaction
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MegaCoinTransaction', megaCoinTransactionSchema);

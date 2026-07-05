const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [returnItemSchema],
    reason: {
      type: String,
      enum: [
        'defective',
        'wrong-item',
        'not-as-described',
        'damaged-in-shipping',
        'changed-mind',
        'other',
      ],
      required: true,
    },
    reasonDetail: { type: String, default: '' },
    evidence: [{ url: String, publicId: String }], // Cloudinary images

    status: {
      type: String,
      enum: ['requested', 'under-review', 'approved', 'rejected', 'refunded'],
      default: 'requested',
    },

    adminNote: { type: String, default: '' },

    refundMethod: {
      type: String,
      enum: ['original-payment', 'megacoin'],
      default: 'original-payment',
    },
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

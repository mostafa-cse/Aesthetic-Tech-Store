const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    regularPrice: Number,
    discountPrice: Number,
    quantity: { type: Number, required: true, min: 1 },
    price: Number, // price at time of purchase
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      district: String,
      postalCode: String,
    },

    // Pricing breakdown
    subtotal: { type: Number, required: true },
    couponDiscount: { type: Number, default: 0 },
    megaCoinDiscount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Applied coupon
    couponUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },

    // MegaCoin
    megaCoinsRedeemed: { type: Number, default: 0 },
    megaCoinsEarned: { type: Number, default: 0 },

    // Payment
    paymentMethod: { type: String, enum: ['stripe', 'cod'], default: 'stripe', lowercase: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt: Date,

    // Order status
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    deliveredAt: Date,

    // Admin note
    adminNote: { type: String, default: '' },

    // Status history
    timeline: [timelineSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

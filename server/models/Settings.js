const mongoose = require('mongoose');

// Global store settings (single document)
const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'Aesthetic Tech Store' },
    megaCoin: {
      earnRate: { type: Number, default: 10 },       // ৳1 spent = earnRate/100 coins (e.g., ৳10 = 1 coin)
      redeemRate: { type: Number, default: 10 },     // 10 coins = ৳1
      maxRedeemPerOrder: { type: Number, default: 500 },
      isEnabled: { type: Boolean, default: true },
    },
    returnPolicy: {
      windowDays: { type: Number, default: 7 },
      globalConditions: { type: String, default: 'Item must be unused and in original packaging.' },
    },
    shippingPolicy: { type: String, default: 'Free shipping on orders above ৳1000. Standard delivery 3-5 business days.' },
    warrantyPolicy: { type: String, default: 'Warranty claims must be submitted within the warranty period with proof of purchase.' },
    herobanners: [{ url: String, publicId: String, title: String, subtitle: String, link: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: 0,
    },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percentage discounts
    expiry: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: '' },
    applicableCategories: [String], // empty = all categories
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Virtual: is coupon valid right now?
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.expiry < now) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
});

couponSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Coupon', couponSchema);

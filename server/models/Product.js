const mongoose = require('mongoose');

const configSpecSchema = new mongoose.Schema(
  { key: String, value: String },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    description: { type: String, required: true },
    images: [{ url: String, publicId: String }],

    // Dynamic configuration specs (e.g. RAM: 16GB, Storage: 512GB SSD)
    configuration: [configSpecSchema],

    // Guarantee — manufacturing defect coverage
    guarantee: {
      duration: { type: Number, default: 0 },
      unit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
      terms: { type: String, default: '' },
    },

    // Warranty — service/repair coverage
    warranty: {
      duration: { type: Number, default: 0 },
      unit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
      terms: { type: String, default: '' },
    },

    regularPrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },

    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, trim: true },

    // MegaCoin rewards — how many coins per ৳1 spent (overrides global if set)
    megaCoinRewardRate: { type: Number, default: null },

    // Return policy for this product
    returnPolicy: {
      eligible: { type: Boolean, default: true },
      windowDays: { type: Number, default: 7 },
      conditions: { type: String, default: 'Item must be in original condition' },
    },

    tags: [String],

    // Aggregated review data
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug from name
productSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  const slugify = require('slugify');
  let slug = slugify(this.name, { lower: true, strict: true });
  const exists = await mongoose.model('Product').findOne({ slug });
  if (exists && exists._id.toString() !== this._id.toString()) {
    slug = `${slug}-${Date.now()}`;
  }
  this.slug = slug;
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function () {
  if (!this.discountPrice || this.discountPrice >= this.regularPrice) return 0;
  return Math.round(((this.regularPrice - this.discountPrice) / this.regularPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

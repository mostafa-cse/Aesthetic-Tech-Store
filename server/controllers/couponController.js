const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc    Validate coupon (user applies at checkout)
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
  if (!coupon || !coupon.isValid) {
    res.status(400);
    throw new Error('Invalid or expired coupon');
  }
  if (subtotal < coupon.minPurchase) {
    res.status(400);
    throw new Error(`Minimum purchase ৳${coupon.minPurchase} required`);
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = Math.min(coupon.value, subtotal);
  }

  res.json({
    success: true,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
    discount: Math.round(discount),
  });
});

// @desc    Get all coupons (admin)
// @route   GET /api/admin/coupons
// @access  Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc    Create coupon (admin)
// @route   POST /api/admin/coupons
// @access  Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minPurchase, maxDiscount, expiry, usageLimit, description, applicableCategories } = req.body;
  const exists = await Coupon.findOne({ code: code?.toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }
  const coupon = await Coupon.create({
    code, type, value, minPurchase, maxDiscount, expiry,
    usageLimit: usageLimit || null, description, applicableCategories,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, coupon });
});

// @desc    Update coupon (admin)
// @route   PUT /api/admin/coupons/:id
// @access  Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ success: true, coupon });
});

// @desc    Delete coupon (admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ success: true, message: 'Coupon deleted' });
});

// @desc    Toggle coupon active status (admin)
// @route   PATCH /api/admin/coupons/:id/toggle
// @access  Admin
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, coupon });
});

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon };

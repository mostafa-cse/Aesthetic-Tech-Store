const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const MegaCoinTransaction = require('../models/MegaCoinTransaction');
const Settings = require('../models/Settings');
const { sendEmail, orderConfirmationEmail } = require('../utils/sendEmail');

// Helper: calculate MegaCoins earned from order
const calcMegaCoinsEarned = (totalAmount, earnRate) => {
  return Math.floor(totalAmount / earnRate);
};

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'cod', couponCode, megaCoinsToRedeem = 0 } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Get settings
  const settings = await Settings.findOne();
  const megaCoinConfig = settings?.megaCoin || { earnRate: 10, redeemRate: 10, maxRedeemPerOrder: 500, isEnabled: true };

  // Build order items & check stock
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`Product "${product?.name}" is no longer available`);
    }
    if (product.stock < cartItem.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}"`);
    }
    const price = product.discountPrice || product.regularPrice;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      regularPrice: product.regularPrice,
      discountPrice: product.discountPrice,
      quantity: cartItem.quantity,
      price,
    });
    subtotal += price * cartItem.quantity;
  }

  // Apply coupon
  let couponDiscount = 0;
  let couponDoc = null;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!couponDoc || !couponDoc.isValid) {
      res.status(400);
      throw new Error('Invalid or expired coupon');
    }
    if (subtotal < couponDoc.minPurchase) {
      res.status(400);
      throw new Error(`Minimum purchase ৳${couponDoc.minPurchase} required for this coupon`);
    }
    if (couponDoc.type === 'percentage') {
      couponDiscount = (subtotal * couponDoc.value) / 100;
      if (couponDoc.maxDiscount) couponDiscount = Math.min(couponDiscount, couponDoc.maxDiscount);
    } else {
      couponDiscount = Math.min(couponDoc.value, subtotal);
    }
    couponDiscount = Math.round(couponDiscount);
  }

  // Apply MegaCoins
  let megaCoinDiscount = 0;
  let megaCoinsRedeemed = 0;
  const user = await User.findById(req.user._id);
  if (megaCoinsToRedeem > 0 && megaCoinConfig.isEnabled) {
    const maxRedeemable = Math.min(megaCoinsToRedeem, user.megaCoinBalance, megaCoinConfig.maxRedeemPerOrder);
    megaCoinsRedeemed = Math.floor(maxRedeemable);
    megaCoinDiscount = Math.floor(megaCoinsRedeemed / megaCoinConfig.redeemRate);
  }

  const totalAmount = Math.max(0, subtotal - couponDiscount - megaCoinDiscount);

  // Calculate MegaCoins earned
  const earnRate = megaCoinConfig.earnRate;
  const megaCoinsEarned = megaCoinConfig.isEnabled ? calcMegaCoinsEarned(totalAmount, earnRate) : 0;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    couponDiscount,
    megaCoinDiscount,
    shippingCost: 0,
    totalAmount,
    couponUsed: couponDoc?._id || null,
    couponCode: couponDoc?.code || '',
    megaCoinsRedeemed,
    megaCoinsEarned,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: 'pending',
    timeline: [{ status: 'pending', message: 'Order placed successfully' }],
  });

  // Update stock, coupon usage, user MegaCoins
  await Promise.all([
    ...cart.items.map((item) =>
      Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } })
    ),
    couponDoc && Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } }),
    User.findByIdAndUpdate(req.user._id, {
      $inc: { megaCoinBalance: megaCoinsEarned - megaCoinsRedeemed },
    }),
  ].filter(Boolean));

  // Log MegaCoin transactions
  if (megaCoinsEarned > 0) {
    await MegaCoinTransaction.create({
      user: req.user._id, type: 'earn', amount: megaCoinsEarned,
      balance: user.megaCoinBalance - megaCoinsRedeemed + megaCoinsEarned,
      order: order._id, description: `Earned from Order #${order._id.toString().slice(-8).toUpperCase()}`,
    });
  }
  if (megaCoinsRedeemed > 0) {
    await MegaCoinTransaction.create({
      user: req.user._id, type: 'redeem', amount: -megaCoinsRedeemed,
      balance: user.megaCoinBalance - megaCoinsRedeemed,
      order: order._id, description: `Redeemed for Order #${order._id.toString().slice(-8).toUpperCase()}`,
    });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  // Send confirmation email
  await sendEmail({ to: user.email, subject: '✅ Order Confirmed — Aesthetic Tech Store', html: orderConfirmationEmail(order, user) });

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images');
  res.json({ success: true, orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (status) query.orderStatus = status;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  let orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('user', 'name email')
    .populate('items.product', 'name images');

  const total = await Order.countDocuments(query);
  res.json({ success: true, orders, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } });
});

// @desc    Update order status (admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.orderStatus = status;
  if (adminNote) order.adminNote = adminNote;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }
  order.timeline.push({ status, message: `Status updated to ${status}` });
  await order.save();
  res.json({ success: true, order });
});

// @desc    Get order analytics (admin)
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const [totalOrders, totalUsers, revenueAgg, topProducts] = await Promise.all([
    Order.countDocuments({ paymentStatus: 'paid' }),
    (await import('../models/User.js').catch(() => require('../models/User'))).default?.countDocuments?.() || User.countDocuments?.(),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
    ]),
  ]);

  // Weekly revenue
  const weeklyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dayOfWeek: '$createdAt' }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    { $sort: { '_id': 1 } },
  ]);

  res.json({
    success: true,
    analytics: {
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      totalProducts: await Product.countDocuments({ isActive: true }),
      totalUsers: await User.countDocuments(),
      topProducts,
      weeklyRevenue,
    },
  });
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getAnalytics };

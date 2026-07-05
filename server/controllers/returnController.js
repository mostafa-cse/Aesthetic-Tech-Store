const asyncHandler = require('express-async-handler');
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const MegaCoinTransaction = require('../models/MegaCoinTransaction');
const Settings = require('../models/Settings');
const { sendEmail, returnUpdateEmail } = require('../utils/sendEmail');

// @desc    Submit return request
// @route   POST /api/returns
// @access  Private
const submitReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, items, reason, reasonDetail, refundMethod } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (order.orderStatus !== 'delivered') {
    res.status(400);
    throw new Error('Return can only be requested for delivered orders');
  }

  // Check return window
  const settings = await Settings.findOne();
  const windowDays = settings?.returnPolicy?.windowDays || 7;
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = (Date.now() - new Date(deliveredAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > windowDays) {
    res.status(400);
    throw new Error(`Return window expired. Returns must be requested within ${windowDays} days of delivery`);
  }

  // Check no duplicate return for same order
  const existing = await ReturnRequest.findOne({ order: orderId, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('A return request already exists for this order');
  }

  const evidence = req.files ? req.files.map((f) => ({ url: f.path, publicId: f.filename })) : [];

  const returnRequest = await ReturnRequest.create({
    order: orderId,
    user: req.user._id,
    items: items ? JSON.parse(items) : [],
    reason,
    reasonDetail,
    evidence,
    refundMethod,
  });

  res.status(201).json({ success: true, returnRequest });
});

// @desc    Get user's return requests
// @route   GET /api/returns/my
// @access  Private
const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('order', 'createdAt totalAmount')
    .populate('items.product', 'name images');
  res.json({ success: true, returns });
});

// @desc    Get all return requests (admin)
// @route   GET /api/admin/returns
// @access  Admin
const getAllReturns = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const pageNum = parseInt(page);
  const returns = await ReturnRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('user', 'name email')
    .populate('order', 'totalAmount createdAt')
    .populate('items.product', 'name images');
  const total = await ReturnRequest.countDocuments(query);
  res.json({ success: true, returns, pagination: { total, page: pageNum } });
});

// @desc    Update return request status (admin)
// @route   PUT /api/admin/returns/:id
// @access  Admin
const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, adminNote, refundAmount } = req.body;
  const returnRequest = await ReturnRequest.findById(req.params.id).populate('user');
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  returnRequest.status = status;
  if (adminNote) returnRequest.adminNote = adminNote;

  // Process refund if approved
  if (status === 'refunded') {
    returnRequest.refundAmount = refundAmount || 0;
    returnRequest.refundedAt = new Date();

    if (returnRequest.refundMethod === 'megacoin') {
      const settings = await Settings.findOne();
      const redeemRate = settings?.megaCoin?.redeemRate || 10;
      const coinsToCredit = Math.floor((refundAmount || 0) * redeemRate);
      await User.findByIdAndUpdate(returnRequest.user._id, { $inc: { megaCoinBalance: coinsToCredit } });
      await MegaCoinTransaction.create({
        user: returnRequest.user._id,
        type: 'refund-credit',
        amount: coinsToCredit,
        balance: returnRequest.user.megaCoinBalance + coinsToCredit,
        description: `Refund credit for Return #${returnRequest._id.toString().slice(-6)}`,
      });
    }
    // For 'original-payment' — manual/Stripe refund process
  }

  await returnRequest.save();

  // Send email update
  await sendEmail({
    to: returnRequest.user.email,
    subject: `Return Request Update — ${status.toUpperCase()}`,
    html: returnUpdateEmail(returnRequest, returnRequest.user, status),
  });

  res.json({ success: true, returnRequest });
});

module.exports = { submitReturnRequest, getMyReturns, getAllReturns, updateReturnStatus };

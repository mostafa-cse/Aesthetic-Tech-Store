const asyncHandler = require('express-async-handler');
const MegaCoinTransaction = require('../models/MegaCoinTransaction');
const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Get user's MegaCoin balance & transactions
// @route   GET /api/megacoin/my
// @access  Private
const getMyMegaCoins = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('megaCoinBalance');
  const transactions = await MegaCoinTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('order', 'createdAt');
  res.json({ success: true, balance: user.megaCoinBalance, transactions });
});

// @desc    Get MegaCoin settings
// @route   GET /api/megacoin/settings
// @access  Public
const getMegaCoinSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();
  res.json({ success: true, megaCoin: settings?.megaCoin || {} });
});

// @desc    Update MegaCoin settings (admin)
// @route   PUT /api/admin/megacoin/settings
// @access  Admin
const updateMegaCoinSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();
  settings.megaCoin = { ...settings.megaCoin, ...req.body };
  await settings.save();
  res.json({ success: true, megaCoin: settings.megaCoin });
});

// @desc    Admin manually adjust user MegaCoins
// @route   POST /api/admin/megacoin/adjust
// @access  Admin
const adjustUserMegaCoins = asyncHandler(async (req, res) => {
  const { userId, amount, description } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const newBalance = Math.max(0, user.megaCoinBalance + amount);
  user.megaCoinBalance = newBalance;
  await user.save();
  await MegaCoinTransaction.create({
    user: userId,
    type: amount >= 0 ? 'admin-credit' : 'admin-deduct',
    amount,
    balance: newBalance,
    description: description || `Admin adjustment`,
  });
  res.json({ success: true, newBalance });
});

// @desc    Get all users' MegaCoin balances (admin)
// @route   GET /api/admin/megacoin/users
// @access  Admin
const getAllUsersMegaCoins = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email megaCoinBalance').sort({ megaCoinBalance: -1 });
  res.json({ success: true, users });
});

module.exports = { getMyMegaCoins, getMegaCoinSettings, updateMegaCoinSettings, adjustUserMegaCoins, getAllUsersMegaCoins };

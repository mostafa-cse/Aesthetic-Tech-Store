const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const pageNum = parseInt(page);
  const query = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};
  const users = await User.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * parseInt(limit)).limit(parseInt(limit));
  const total = await User.countDocuments(query);
  res.json({ success: true, users, pagination: { total, page: pageNum } });
});

// @desc    Toggle user active status (admin)
// @route   PATCH /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot suspend admin accounts');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});



// @desc    Update user profile (self)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { name, phone } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (req.file) {
    const isCloudinary = req.file.path && req.file.path.startsWith('http');
    const { cloudinary } = require('../config/cloudinary');
    if (user.avatarPublicId && isCloudinary) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        // Ignored
      }
    }
    user.avatar = isCloudinary ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    user.avatarPublicId = req.file.filename;
  }
  await user.save();
  res.json({ success: true, user });
});

// @desc    Update password (self)
// @route   PUT /api/users/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Manage user addresses
// @route   POST /api/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, fullName, phone, address, city, district, postalCode, isDefault } = req.body;
  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }
  user.addresses.push({ label, fullName, phone, address, city, district, postalCode, isDefault });
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

module.exports = { getAllUsers, toggleUserStatus, updateProfile, updatePassword, addAddress, deleteAddress };

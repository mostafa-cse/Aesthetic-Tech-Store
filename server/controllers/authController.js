const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/generateToken');
const { sendEmail, passwordResetEmail } = require('../utils/sendEmail');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, firebaseUid } = req.body;
  if (!name || !email || (!password && !firebaseUid)) {
    res.status(400);
    throw new Error('Please provide name, email, and either password or firebaseUid');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const user = await User.create({ name, email, password, firebaseUid });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  setTokenCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, megaCoinBalance: user.megaCoinBalance },
    accessToken,
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, firebaseUid } = req.body;
  if (!email || (!password && !firebaseUid)) {
    res.status(400);
    throw new Error('Please provide email, and either password or firebaseUid');
  }
  const user = await User.findOne({ email }).select('+password +firebaseUid');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if firebaseUid matches OR password matches
  const isFirebaseMatch = firebaseUid && user.firebaseUid === firebaseUid;
  const isPasswordMatch = password && await user.comparePassword(password);

  if (!isFirebaseMatch && !isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account suspended. Contact support.');
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  setTokenCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, megaCoinBalance: user.megaCoinBalance, avatar: user.avatar },
    accessToken,
  });
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');
  if (user) {
    user.refreshToken = '';
    await user.save({ validateBeforeSave: false });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    res.status(401);
    throw new Error('No refresh token');
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error('Refresh token mismatch');
  }
  const newAccessToken = generateAccessToken(user._id);
  res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
  res.json({ success: true, accessToken: newAccessToken });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc    Forgot password — send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('No user with that email');
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });
  await sendEmail({ to: user.email, subject: 'Password Reset OTP — Aesthetic Tech Store', html: passwordResetEmail(user.name, otp) });
  res.json({ success: true, message: 'OTP sent to email' });
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await User.findOne({ email, resetPasswordOTP: hashedOTP, resetPasswordExpire: { $gt: Date.now() } }).select('+resetPasswordOTP +resetPasswordExpire');
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful' });
});

module.exports = { register, login, logout, refreshToken, getMe, forgotPassword, resetPassword };

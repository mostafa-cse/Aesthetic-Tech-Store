const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserStatus, getSettings, updateSettings, updateProfile, updatePassword, addAddress, deleteAddress } = require('../controllers/adminController');
const { deleteReview } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../config/cloudinary');

// User self-management
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/password', protect, updatePassword);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Admin — user management
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.patch('/admin/users/:id/toggle', protect, adminOnly, toggleUserStatus);

// Admin — settings
router.get('/admin/settings', protect, adminOnly, getSettings);
router.put('/admin/settings', protect, adminOnly, updateSettings);

// Admin — reviews
router.delete('/admin/reviews/:id', protect, adminOnly, deleteReview);

module.exports = router;

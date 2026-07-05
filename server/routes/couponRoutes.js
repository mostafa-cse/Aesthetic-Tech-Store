const express = require('express');
const router = express.Router();
const { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/validate', protect, validateCoupon);

// Admin
router.get('/admin', protect, adminOnly, getAllCoupons);
router.post('/admin', protect, adminOnly, createCoupon);
router.put('/admin/:id', protect, adminOnly, updateCoupon);
router.delete('/admin/:id', protect, adminOnly, deleteCoupon);
router.patch('/admin/:id/toggle', protect, adminOnly, toggleCoupon);

module.exports = router;

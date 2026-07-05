const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getAnalytics } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/analytics', protect, adminOnly, getAnalytics);
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;

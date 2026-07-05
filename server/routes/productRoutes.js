const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, removeProductImage } = require('../controllers/productController');
const { getProductReviews, addReview } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../config/cloudinary');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:productId/reviews', getProductReviews);

// Private
router.post('/:productId/reviews', protect, addReview);

// Admin
router.post('/admin/create', protect, adminOnly, uploadProductImages.array('images', 10), createProduct);
router.put('/admin/:id', protect, adminOnly, uploadProductImages.array('images', 10), updateProduct);
router.delete('/admin/:id', protect, adminOnly, deleteProduct);
router.delete('/admin/:id/images/:publicId', protect, adminOnly, removeProductImage);

module.exports = router;

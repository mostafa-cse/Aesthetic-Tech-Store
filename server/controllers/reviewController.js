const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const reviews = await Review.find({ product: req.params.productId })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('user', 'name avatar');
  const total = await Review.countDocuments({ product: req.params.productId });
  res.json({ success: true, reviews, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } });
});

// @desc    Add review (verified purchase)
// @route   POST /api/products/:productId/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, orderId } = req.body;
  // Verify purchase
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    orderStatus: 'delivered',
    'items.product': req.params.productId,
  });
  if (!order) {
    res.status(403);
    throw new Error('You can only review products you have purchased and received');
  }
  const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }
  const review = await Review.create({
    product: req.params.productId,
    user: req.user._id,
    order: orderId,
    rating: Number(rating),
    title,
    comment,
  });
  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
});

// @desc    Delete review (admin or owner)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  await review.deleteOne();
  await Review.calcAverageRating(review.product);
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getProductReviews, addReview, deleteReview };

const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all products with filters, search, pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, brand, minPrice, maxPrice, minRating, sort, page = 1, limit = 12, featured } = req.query;

  const query = { isActive: true };

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { brand: { $regex: keyword, $options: 'i' } },
      { tags: { $regex: keyword, $options: 'i' } },
    ];
  }
  if (category) query.category = { $regex: category, $options: 'i' };
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (featured === 'true') query.isFeatured = true;

  const priceField = {};
  if (minPrice) priceField.$gte = Number(minPrice);
  if (maxPrice) priceField.$lte = Number(maxPrice);
  if (Object.keys(priceField).length) {
    query.$or = [
      { discountPrice: priceField },
      { regularPrice: priceField },
    ];
  }
  if (minRating) query.ratings = { $gte: Number(minRating) };

  const sortMap = {
    'price-asc': { discountPrice: 1 },
    'price-desc': { discountPrice: -1 },
    'rating': { ratings: -1 },
    'newest': { createdAt: -1 },
    'popular': { numReviews: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOption).skip(skip).limit(limitNum).select('-__v'),
    Product.countDocuments(query),
  ]);

  // Get unique categories and brands for filter sidebar
  const [categories, brands] = await Promise.all([
    Product.distinct('category', { isActive: true }),
    Product.distinct('brand', { isActive: true }),
  ]);

  res.json({
    success: true,
    products,
    categories,
    brands,
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const product = await Product.findOne({ ...query, isActive: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @desc    Create product (admin)
// @route   POST /api/admin/products
// @access  Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, category, brand, model, description,
    configuration, guarantee, warranty,
    regularPrice, discountPrice, stock, sku,
    megaCoinRewardRate, returnPolicy, tags, isFeatured,
  } = req.body;

  const images = req.files ? req.files.map((f) => ({ url: f.path, publicId: f.filename })) : [];

  const product = await Product.create({
    name,
    category,
    brand,
    model,
    description,
    images,
    configuration: configuration ? JSON.parse(configuration) : [],
    guarantee: guarantee ? JSON.parse(guarantee) : {},
    warranty: warranty ? JSON.parse(warranty) : {},
    regularPrice: Number(regularPrice),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    stock: Number(stock),
    sku,
    megaCoinRewardRate: megaCoinRewardRate ? Number(megaCoinRewardRate) : null,
    returnPolicy: returnPolicy ? JSON.parse(returnPolicy) : {},
    tags: tags ? JSON.parse(tags) : [],
    isFeatured: isFeatured === 'true',
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product (admin)
// @route   PUT /api/admin/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updates = { ...req.body };
  if (updates.configuration) updates.configuration = JSON.parse(updates.configuration);
  if (updates.guarantee) updates.guarantee = JSON.parse(updates.guarantee);
  if (updates.warranty) updates.warranty = JSON.parse(updates.warranty);
  if (updates.returnPolicy) updates.returnPolicy = JSON.parse(updates.returnPolicy);
  if (updates.tags) updates.tags = JSON.parse(updates.tags);
  if (updates.regularPrice) updates.regularPrice = Number(updates.regularPrice);
  if (updates.discountPrice) updates.discountPrice = Number(updates.discountPrice);
  if (updates.stock !== undefined) updates.stock = Number(updates.stock);

  // Add new images if uploaded
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    updates.images = [...product.images, ...newImages];
  }

  Object.assign(product, updates);
  await product.save();
  res.json({ success: true, product });
});

// @desc    Delete product (admin)
// @route   DELETE /api/admin/products/:id
// @access  Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Soft delete
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product removed' });
});

// @desc    Remove specific image from product (admin)
// @route   DELETE /api/admin/products/:id/images/:publicId
// @access  Admin
const removeProductImage = asyncHandler(async (req, res) => {
  const { cloudinary } = require('../config/cloudinary');
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const publicId = decodeURIComponent(req.params.publicId);
  await cloudinary.uploader.destroy(publicId);
  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();
  res.json({ success: true, images: product.images });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, removeProductImage };

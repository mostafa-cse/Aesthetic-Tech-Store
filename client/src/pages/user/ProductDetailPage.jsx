import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar, FiShoppingCart, FiHeart, FiShare2, FiShield,
  FiPackage, FiCheck, FiX, FiChevronLeft, FiChevronRight,
  FiTag, FiAlertCircle, FiThumbsUp, FiUser, FiClock
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { addToCart } from '../../features/cart/cartSlice';
import { setCartDrawerOpen } from '../../features/ui/uiSlice';
import ProductCard from '../../components/user/ProductCard';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function StarRating({ value, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const cls = size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${cls} transition-colors ${
            s <= (hover || value) ? 'text-warning' : 'text-gray-600'
          } ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Please write a review comment'); return; }
    setLoading(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title, comment });
      toast.success('Review submitted!');
      setTitle(''); setComment(''); setRating(5);
      onSubmit?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-white">Write a Review</h3>
      <div>
        <label className="input-label">Your Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label className="input-label">Title (optional)</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarize your review"
          className="input"
        />
      </div>
      <div>
        <label className="input-label">Your Review</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="input resize-none"
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(s => s.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [related, setRelated] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setActiveImg(0);
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    // Fetch reviews
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/products/${product._id}/reviews`);
        setReviews(res.data.reviews || []);
      } catch { setReviews([]); }
      finally { setReviewsLoading(false); }
    };
    // Fetch related
    const fetchRelated = async () => {
      try {
        const res = await api.get(`/products?category=${product.category}&limit=4&sort=popular`);
        setRelated((res.data.products || []).filter(p => p._id !== product._id).slice(0, 4));
      } catch { setRelated([]); }
    };
    // Check if user can review
    const checkCanReview = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/orders/my');
        const orders = res.data.orders || [];
        const hasOrdered = orders.some(o =>
          o.items?.some(item => item.product === product._id || item.product?._id === product._id)
          && o.orderStatus === 'delivered'
        );
        setCanReview(hasOrdered);
      } catch { setCanReview(false); }
    };
    fetchReviews();
    fetchRelated();
    checkCanReview();
  }, [product, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAddingCart(true);
    const result = await dispatch(addToCart({ productId: product._id, quantity }));
    if (addToCart.fulfilled.match(result)) {
      toast.success('Added to cart!');
      dispatch(setCartDrawerOpen(true));
    } else {
      toast.error(result.payload || 'Failed to add to cart');
    }
    setAddingCart(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-3">
              <div className="skeleton aspect-square rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />)}
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`skeleton h-${i === 0 ? 8 : 4} rounded`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const price = product.discountPrice || product.regularPrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.regularPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)
    : 0;
  const images = product.images?.length ? product.images : [{ url: '/placeholder.png', alt: product.name }];
  const inStock = product.stock > 0;
  const coinsEarned = product.megaCoinRewardRate
    ? Math.floor((price * product.megaCoinRewardRate) / 100)
    : Math.floor(price / 10);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-primary transition-colors capitalize">
            {product.category?.replace(/-/g, ' ')}
          </Link>
          <span>/</span>
          <span className="text-gray-300 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-10 mb-16">

          {/* ── Image Gallery ─────────────────────────────────────── */}
          <div className="space-y-3">
            <motion.div
              key={activeImg}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-dark-card border border-dark-border"
            >
              {discountPct > 0 && (
                <span className="discount-tag text-sm px-3 py-1.5">-{discountPct}%</span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="text-white font-semibold text-lg">Out of Stock</span>
                </div>
              )}
              <img
                src={images[activeImg]?.url}
                alt={images[activeImg]?.alt || product.name}
                className="w-full h-full object-contain p-4"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-surface/80 backdrop-blur rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-dark-card transition-all"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-surface/80 backdrop-blur rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-dark-card transition-all"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImg ? 'border-primary shadow-glow-sm' : 'border-dark-border hover:border-primary/50'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Brand & name */}
            <div>
              <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-1">{product.brand}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{product.name}</h1>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating value={Math.round(product.ratings || 0)} />
              <span className="text-sm text-gray-300 font-medium">{(product.ratings || 0).toFixed(1)}</span>
              <span className="text-sm text-gray-500">({product.numReviews || 0} reviews)</span>
              {product.numReviews > 50 && <span className="badge-success text-xs">Bestseller</span>}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-4xl font-bold text-white">৳{price?.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">৳{product.regularPrice?.toLocaleString()}</span>
                  <span className="badge-error text-sm px-3 py-1">Save {discountPct}%</span>
                </>
              )}
            </div>

            {/* MegaCoin badge */}
            <div className="megacoin-chip text-sm w-fit">
              🪙 Earn +{coinsEarned} MegaCoins with this purchase
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-success font-medium">
                    In Stock {product.stock <= 10 && `(Only ${product.stock} left)`}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-sm text-error font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-dark-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-muted transition-all"
                >
                  −
                </button>
                <span className="w-12 text-center text-white font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  disabled={!inStock}
                  className="w-10 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-muted transition-all disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingCart}
                className="flex-1 min-w-[160px] btn-primary flex items-center justify-center gap-2 py-3"
              >
                {addingCart ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding…
                  </span>
                ) : (
                  <>
                    <FiShoppingCart className="text-lg" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={() => setWishlisted(w => !w)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  wishlisted
                    ? 'bg-error/20 border-error/40 text-error'
                    : 'border-dark-border text-gray-400 hover:text-error hover:border-error/40'
                }`}
              >
                <FiHeart />
              </button>
            </div>

            {/* Warranty & Guarantee cards */}
            {(product.warranty?.duration > 0 || product.guarantee?.duration > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {product.warranty?.duration > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <FiShield className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-accent">Warranty</p>
                      <p className="text-xs text-gray-400">
                        {product.warranty.duration} {product.warranty.unit}
                        {product.warranty.type && ` (${product.warranty.type})`}
                      </p>
                    </div>
                  </div>
                )}
                {product.guarantee?.duration > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                    <FiCheck className="text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-success">Guarantee</p>
                      <p className="text-xs text-gray-400">
                        {product.guarantee.duration} {product.guarantee.unit} satisfaction
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dark-border">
              <span className="text-xs text-gray-500">Category:</span>
              <Link to={`/products?category=${product.category}`}>
                <span className="badge-primary capitalize">{product.category?.replace(/-/g, ' ')}</span>
              </Link>
              {product.tags?.length > 0 && (
                <>
                  <span className="text-xs text-gray-500 ml-2">Tags:</span>
                  {product.tags.map(tag => (
                    <Link key={tag} to={`/products?keyword=${tag}`}>
                      <span className="text-xs bg-dark-muted text-gray-400 hover:text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors cursor-pointer">
                        #{tag}
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────── */}
        {product.description && (
          <section className="card mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Description</h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {/* ── Configuration / Specs ────────────────────────────────── */}
        {product.configuration && Object.keys(product.configuration).length > 0 && (
          <section className="card mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Specifications</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.configuration).map(([key, value], i) => (
                    <tr key={key} className={`border-b border-dark-border/50 ${i % 2 === 0 ? 'bg-dark-surface/30' : ''}`}>
                      <td className="py-3 px-4 text-gray-400 font-medium w-1/3 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-gray-200">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Reviews ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Customer Reviews
              <span className="text-gray-500 font-normal text-base ml-2">({reviews.length})</span>
            </h2>
            {product.ratings > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">{(product.ratings || 0).toFixed(1)}</span>
                <div>
                  <StarRating value={Math.round(product.ratings || 0)} />
                  <p className="text-xs text-gray-500">{product.numReviews} reviews</p>
                </div>
              </div>
            )}
          </div>

          {/* Review form */}
          {isAuthenticated && canReview && (
            <div className="mb-6">
              <ReviewForm productId={product._id} onSubmit={() => {
                // Re-fetch reviews
                api.get(`/products/${product._id}/reviews`).then(r => setReviews(r.data.reviews || []));
              }} />
            </div>
          )}
          {isAuthenticated && !canReview && (
            <div className="card mb-6 flex items-center gap-3 text-gray-500">
              <FiAlertCircle className="text-warning shrink-0" />
              <p className="text-sm">You need to purchase and receive this product to write a review.</p>
            </div>
          )}
          {!isAuthenticated && (
            <div className="card mb-6 flex items-center gap-3">
              <FiUser className="text-primary shrink-0" />
              <p className="text-sm text-gray-400">
                <Link to="/login" className="text-primary hover:underline">Login</Link> to write a review
              </p>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="skeleton h-4 w-1/4 rounded" />
                      <div className="skeleton h-3 w-1/5 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-400">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev, i) => (
                <motion.div
                  key={rev._id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {rev.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{rev.user?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2">
                          <StarRating value={rev.rating} />
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiClock className="text-xs" />
                            {new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rev.verifiedPurchase && (
                      <span className="badge-success text-xs whitespace-nowrap"><FiCheck className="inline mr-0.5" />Verified</span>
                    )}
                  </div>
                  {rev.title && <p className="text-sm font-semibold text-white mb-1">{rev.title}</p>}
                  <p className="text-sm text-gray-400 leading-relaxed">{rev.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── Related Products ─────────────────────────────────────── */}
        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Related Products</h2>
              <Link
                to={`/products?category=${product.category}`}
                className="text-sm text-primary hover:text-primary-300 transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

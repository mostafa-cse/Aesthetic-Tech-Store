import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiStar, FiHeart } from 'react-icons/fi';
import { addToCart } from '../../features/cart/cartSlice';
import { setCartDrawerOpen } from '../../features/ui/uiSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const dispatch = useDispatch();
  const price = product.discountPrice || product.regularPrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.regularPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success('Added to cart!');
      dispatch(setCartDrawerOpen(true));
    } else {
      toast.error(result.payload || 'Failed to add to cart');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/products/${product.slug || product._id}`}>
        <div className="product-card group">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-dark-muted">
            {discountPct > 0 && (
              <span className="discount-tag">-{discountPct}%</span>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <span className="text-white font-semibold text-sm">Out of Stock</span>
              </div>
            )}
            <img
              src={product.images?.[0]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Quick actions overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-glow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShoppingCart className="text-sm" /> Add to Cart
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
            <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-xs ${star <= Math.round(product.ratings) ? 'text-warning fill-warning' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.numReviews})</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-white">৳{price?.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="ml-2 text-sm text-gray-500 line-through">৳{product.regularPrice?.toLocaleString()}</span>
                )}
              </div>
              {/* MegaCoin indicator */}
              {product.megaCoinRewardRate && (
                <span className="text-xs text-warning font-semibold flex items-center gap-0.5">
                  🪙 +coins
                </span>
              )}
            </div>

            {/* Warranty pill */}
            {product.warranty?.duration > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
                  {product.warranty.duration} {product.warranty.unit} warranty
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

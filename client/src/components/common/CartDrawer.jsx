import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { setCartDrawerOpen } from '../../features/ui/uiSlice';
import { removeCartItem, updateCartItemQty, selectCartTotal } from '../../features/cart/cartSlice';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const { cartDrawerOpen } = useSelector((s) => s.ui);
  const { items, loading } = useSelector((s) => s.cart);
  const total = useSelector(selectCartTotal);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') dispatch(setCartDrawerOpen(false)); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = cartDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartDrawerOpen]);

  const handleRemove = async (productId) => {
    await dispatch(removeCartItem(productId));
    toast.success('Removed from cart');
  };

  const handleQtyChange = (productId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartItemQty({ productId, quantity: newQty }));
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setCartDrawerOpen(false))}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-dark-surface border-l border-dark-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <FiShoppingBag className="text-primary text-xl" />
                <h2 className="text-lg font-bold text-white">Shopping Cart</h2>
                <span className="badge-primary ml-1">{items.length}</span>
              </div>
              <button
                onClick={() => dispatch(setCartDrawerOpen(false))}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-card rounded-lg transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                  <div className="w-20 h-20 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                    <FiShoppingBag className="text-3xl text-gray-600" />
                  </div>
                  <p className="text-gray-400">Your cart is empty</p>
                  <Link
                    to="/products"
                    onClick={() => dispatch(setCartDrawerOpen(false))}
                    className="btn-primary text-sm"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => {
                  const product = item.product;
                  const price = product?.discountPrice || product?.regularPrice || 0;
                  return (
                    <div key={product?._id} className="flex gap-3 bg-dark-card border border-dark-border rounded-xl p-3">
                      <img
                        src={product?.images?.[0]?.url || '/placeholder.png'}
                        alt={product?.name}
                        className="w-16 h-16 object-cover rounded-lg bg-dark-muted shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{product?.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-primary font-bold text-sm">৳{price.toLocaleString()}</span>
                          {product?.discountPrice && product?.regularPrice > product?.discountPrice && (
                            <span className="text-gray-500 text-xs line-through">৳{product.regularPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQtyChange(product._id, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-dark-muted text-gray-400 hover:text-white hover:bg-primary/30 transition-colors"
                            >
                              <FiMinus className="text-xs" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleQtyChange(product._id, item.quantity + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-dark-muted text-gray-400 hover:text-white hover:bg-primary/30 transition-colors"
                            >
                              <FiPlus className="text-xs" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(product._id)}
                            className="text-gray-500 hover:text-error transition-colors"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-dark-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-xl font-bold text-white">৳{total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">Coupons & MegaCoin discounts applied at checkout</p>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(setCartDrawerOpen(false))}
                  className="btn-primary w-full text-center block py-3"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(setCartDrawerOpen(false))}
                  className="btn-outline w-full text-center block py-2.5 text-sm"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

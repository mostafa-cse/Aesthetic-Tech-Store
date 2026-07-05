import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { updateCartItemQty, removeCartItem, clearCartLocal } from '../../features/cart/cartSlice';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const [useMegaCoins, setUseMegaCoins] = useState(false);
  const [megaCoinsToRedeem, setMegaCoinsToRedeem] = useState(0);
  
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.regularPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const maxMegaCoinsAllowed = Math.min(
    user?.megaCoinBalance || 0,
    500 // assuming 500 max per order based on settings
  );

  const megaCoinDiscount = (megaCoinsToRedeem / 10); // 10 coins = 1 Taka
  
  const total = Math.max(0, subtotal - couponDiscount - megaCoinDiscount);

  const handleQtyChange = (productId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartItemQty({ productId, quantity: newQty }));
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, cartTotal: subtotal });
      const coupon = res.data.coupon;
      setAppliedCoupon(coupon);
      setCouponDiscount(res.data.discountAmount);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        appliedCoupon: appliedCoupon?.code,
        couponDiscount,
        megaCoinsRedeemed: megaCoinsToRedeem,
        megaCoinDiscount,
        total
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-24 h-24 bg-dark-card border border-dark-border rounded-full flex items-center justify-center mx-auto mb-6">
          <FiShoppingBag className="text-4xl text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <FiArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-8">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const price = product.discountPrice || product.regularPrice;
            
            return (
              <div key={product._id} className="card p-4 flex gap-4 sm:gap-6 items-center">
                <Link to={`/products/${product._id}`} className="shrink-0">
                  <img 
                    src={product.images?.[0]?.url || '/placeholder.png'} 
                    alt={product.name} 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-dark-muted"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product._id}`}>
                    <h3 className="text-sm sm:text-base font-semibold text-white hover:text-primary transition-colors truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-primary font-bold">৳{price.toLocaleString()}</span>
                    {product.discountPrice && product.discountPrice < product.regularPrice && (
                      <span className="text-xs text-gray-500 line-through">৳{product.regularPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-1 bg-dark-surface border border-dark-border rounded-lg p-1">
                    <button 
                      onClick={() => handleQtyChange(product._id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-muted rounded transition-colors"
                    >
                      <FiMinus className="text-sm" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => handleQtyChange(product._id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-muted rounded transition-colors"
                    >
                      <FiPlus className="text-sm" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => dispatch(removeCartItem(product._id))}
                    className="p-2 text-gray-500 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Remove Item"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-dark-border pb-4">Order Summary</h2>
            
            {/* Coupon Code */}
            <div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon Code"
                    className="input pl-9 text-sm w-full"
                    disabled={appliedCoupon}
                  />
                </div>
                {!appliedCoupon ? (
                  <button type="submit" className="btn-outline text-sm px-4">Apply</button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponDiscount(0); }}
                    className="btn-outline text-error border-error/50 hover:bg-error/10 hover:border-error text-sm px-4"
                  >
                    Remove
                  </button>
                )}
              </form>
            </div>

            {/* MegaCoin Redemption */}
            {isAuthenticated && user?.megaCoinBalance > 0 && (
              <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪙</span>
                    <span className="text-sm font-semibold text-warning">MegaCoins</span>
                  </div>
                  <span className="text-xs text-gray-400">Balance: {user.megaCoinBalance}</span>
                </div>
                
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mb-3">
                  <input 
                    type="checkbox"
                    checked={useMegaCoins}
                    onChange={(e) => {
                      setUseMegaCoins(e.target.checked);
                      if (e.target.checked) setMegaCoinsToRedeem(Math.min(user.megaCoinBalance, 500));
                      else setMegaCoinsToRedeem(0);
                    }}
                    className="form-checkbox text-warning bg-dark-card border-dark-border rounded focus:ring-warning"
                  />
                  Use MegaCoins
                </label>
                
                {useMegaCoins && (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={maxMegaCoinsAllowed}
                      step="10"
                      value={megaCoinsToRedeem}
                      onChange={(e) => setMegaCoinsToRedeem(Number(e.target.value))}
                      className="w-full accent-warning"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Redeem: {megaCoinsToRedeem} coins</span>
                      <span className="text-warning font-bold">-৳{megaCoinDiscount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-dark-border text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">৳{subtotal.toLocaleString()}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-success">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-৳{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              
              {megaCoinDiscount > 0 && (
                <div className="flex justify-between text-warning">
                  <span>MegaCoin Discount</span>
                  <span>-৳{megaCoinDiscount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-dark-border">
                <span>Total</span>
                <span className="text-primary">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              Proceed to Checkout <FiArrowRight />
            </button>
            
            {!isAuthenticated && (
              <p className="text-xs text-center text-gray-500 mt-3">
                <Link to="/login" className="text-primary hover:underline">Log in</Link> to earn and redeem MegaCoins!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

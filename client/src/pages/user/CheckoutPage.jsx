import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiCreditCard, FiCheckCircle, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { clearCartLocal } from '../../features/cart/cartSlice';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Shipping', icon: FiMapPin },
  { id: 2, title: 'Payment', icon: FiCreditCard },
  { id: 3, title: 'Review', icon: FiCheckCircle },
];

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  
  // From CartPage state
  const { appliedCoupon, couponDiscount, megaCoinsRedeemed, megaCoinDiscount, total } = location.state || {};

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.regularPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  // Fallback if accessed directly without cart/state
  if (items.length === 0) return <Navigate to="/cart" replace />;
  if (total === undefined) return <Navigate to="/cart" replace />;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.addresses?.find(a => a.isDefault)?.address || '',
    city: user?.addresses?.find(a => a.isDefault)?.city || '',
    district: user?.addresses?.find(a => a.isDefault)?.district || '',
    postalCode: user?.addresses?.find(a => a.isDefault)?.postalCode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or Card
  const [checkoutMethod, setCheckoutMethod] = useState('delivery'); // 'delivery' or 'pickup'

  // MegaCoin Earned Calculation
  // 1 coin per 10 Taka spent on the final total (excluding shipping for now, assuming free)
  const megaCoinsEarned = Math.floor(total / 10);

  const handleShippingChange = (e) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city) {
        toast.error('Please fill in all required shipping fields');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
        shippingAddress: shipping,
        paymentMethod,
        couponCode: appliedCoupon,
        megaCoinsRedeemed: megaCoinsRedeemed || 0
      };

      const res = await api.post('/orders', orderData);
      
      // If Stripe was chosen, we would normally redirect to Stripe Checkout here.
      // For this project, we'll assume COD or simulated success.
      
      dispatch(clearCartLocal());
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${res.data.order._id}`);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Stepper */}
      <div className="mb-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-dark-border z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive || isCompleted 
                    ? 'bg-primary text-white shadow-glow-sm' 
                    : 'bg-dark-card border-2 border-dark-border text-gray-500'
                }`}>
                  <Icon className="text-lg" />
                </div>
                <span className={`text-xs font-semibold ${
                  isActive || isCompleted ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* STEP 1: SHIPPING */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">
                  {checkoutMethod === 'pickup' ? 'Pickup Details' : 'Shipping Address'}
                </h2>
                
                {/* Checkout Method Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutMethod('delivery');
                      setShipping({
                        fullName: user?.name || '',
                        phone: user?.phone || '',
                        address: user?.addresses?.find(a => a.isDefault)?.address || '',
                        city: user?.addresses?.find(a => a.isDefault)?.city || '',
                        district: user?.addresses?.find(a => a.isDefault)?.district || '',
                        postalCode: user?.addresses?.find(a => a.isDefault)?.postalCode || '',
                      });
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      checkoutMethod === 'delivery'
                        ? 'bg-primary/10 border-primary text-white shadow-glow-sm'
                        : 'bg-dark-surface border-dark-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-xl">🚚</span>
                    <span className="font-semibold text-sm">Home Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutMethod('pickup');
                      setShipping({
                        fullName: user?.name || '',
                        phone: user?.phone || '',
                        address: 'Instant Pickup (Jashore University Of Science and Technology)',
                        city: 'Jashore',
                        district: 'Jashore',
                        postalCode: '7408',
                      });
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      checkoutMethod === 'pickup'
                        ? 'bg-primary/10 border-primary text-white shadow-glow-sm'
                        : 'bg-dark-surface border-dark-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-xl">🏪</span>
                    <span className="font-semibold text-sm">Instant Pickup</span>
                  </button>
                </div>
                
                {/* Saved Addresses (if any) */}
                {checkoutMethod === 'delivery' && user?.addresses?.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Select Saved Address</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {user.addresses.map((addr) => (
                        <div 
                          key={addr._id}
                          onClick={() => setShipping(addr)}
                          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                            shipping.address === addr.address && shipping.city === addr.city
                              ? 'bg-primary/10 border-primary' 
                              : 'bg-dark-surface border-dark-border hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white text-sm">{addr.label}</span>
                            {addr.isDefault && <span className="badge-primary text-[10px]">Default</span>}
                          </div>
                          <p className="text-xs text-gray-400">{addr.fullName}, {addr.phone}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{addr.address}, {addr.city}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleNext} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Full Name *</label>
                      <input type="text" name="fullName" value={shipping.fullName} onChange={handleShippingChange} required className="input" />
                    </div>
                    <div>
                      <label className="input-label">Phone Number *</label>
                      <input type="tel" name="phone" value={shipping.phone} onChange={handleShippingChange} required className="input" />
                    </div>
                  </div>
                  
                  {checkoutMethod === 'delivery' ? (
                    <>
                      <div>
                        <label className="input-label">Street Address *</label>
                        <input type="text" name="address" value={shipping.address} onChange={handleShippingChange} required className="input" placeholder="House/Apartment, Street name" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="input-label">City *</label>
                          <input type="text" name="city" value={shipping.city} onChange={handleShippingChange} required className="input" />
                        </div>
                        <div>
                          <label className="input-label">District</label>
                          <input type="text" name="district" value={shipping.district} onChange={handleShippingChange} className="input" />
                        </div>
                        <div>
                          <label className="input-label">Postal Code</label>
                          <input type="text" name="postalCode" value={shipping.postalCode} onChange={handleShippingChange} className="input" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-dark-surface rounded-xl border border-dark-border space-y-2">
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>🏪</span> Pickup Location Details
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        <strong>Address:</strong> Jashore University Of Science and Technology (Campus Point)<br />
                        <strong>City:</strong> Jashore, 7408<br />
                        <strong>Contact Support:</strong> 01571276031
                      </p>
                      <p className="text-[11px] text-primary bg-primary/5 p-2 rounded border border-primary/20 mt-2">
                        💡 Collect your order directly from the campus point. Bring your order details or invoice copy.
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      Continue to Payment <FiArrowRight />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: PAYMENT */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  <label className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === 'COD' ? 'bg-primary/10 border-primary' : 'bg-dark-surface border-dark-border hover:border-gray-600'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="form-radio text-primary bg-dark-card border-dark-border focus:ring-primary/50"
                      />
                      <div>
                        <h3 className="font-semibold text-white">Cash on Delivery (COD)</h3>
                        <p className="text-sm text-gray-400">Pay when you receive the package.</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === 'Card' ? 'bg-primary/10 border-primary' : 'bg-dark-surface border-dark-border hover:border-gray-600'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'Card'}
                        onChange={() => setPaymentMethod('Card')}
                        className="form-radio text-primary bg-dark-card border-dark-border focus:ring-primary/50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Credit / Debit Card</h3>
                          <div className="flex gap-1">
                            <div className="w-8 h-5 bg-blue-600 rounded text-[8px] font-bold text-white flex items-center justify-center">VISA</div>
                            <div className="w-8 h-5 bg-orange-500 rounded text-[8px] font-bold text-white flex items-center justify-center">MC</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">Pay securely via Stripe.</p>
                      </div>
                    </div>
                  </label>
                  
                  {/* Fake Stripe Element Placeholder */}
                  {paymentMethod === 'Card' && (
                    <div className="mt-4 p-4 bg-dark-surface border border-dark-border rounded-xl">
                      <div className="h-10 bg-dark-card border border-dark-border rounded flex items-center px-3 mb-3">
                        <span className="text-gray-500 text-sm">Card number</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 bg-dark-card border border-dark-border rounded flex items-center px-3">
                          <span className="text-gray-500 text-sm">MM/YY</span>
                        </div>
                        <div className="h-10 bg-dark-card border border-dark-border rounded flex items-center px-3">
                          <span className="text-gray-500 text-sm">CVC</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <FiCreditCard /> Secured by Stripe (Simulation)
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button onClick={handlePrev} className="btn-ghost flex items-center gap-2">
                    <FiArrowLeft /> Back
                  </button>
                  <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                    Review Order <FiArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Review Your Order</h2>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-dark-surface rounded-xl border border-dark-border">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <FiMapPin className="text-primary" /> {checkoutMethod === 'pickup' ? 'Pickup Details' : 'Shipping Details'}
                    </h3>
                    <p className="text-sm text-white">{shipping.fullName}</p>
                    <p className="text-sm text-gray-400">{shipping.phone}</p>
                    <p className="text-sm text-gray-400">{shipping.address}</p>
                    <p className="text-sm text-gray-400">{shipping.city}, {shipping.district} {shipping.postalCode}</p>
                  </div>
                  
                  <div className="p-4 bg-dark-surface rounded-xl border border-dark-border">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <FiCreditCard className="text-primary" /> Payment Method
                    </h3>
                    <p className="text-sm text-white font-medium">
                      {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex gap-4 items-center">
                      <img src={item.product.images?.[0]?.url || '/placeholder.png'} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover bg-dark-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          ৳{((item.product.discountPrice || item.product.regularPrice) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-dark-border flex items-center justify-between">
                  <button onClick={handlePrev} className="btn-ghost flex items-center gap-2" disabled={loading}>
                    <FiArrowLeft /> Back
                  </button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Place Order <FiCheckCircle /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-dark-border pb-4">Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Items ({items.length})</span>
                <span className="text-white">৳{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Method</span>
                <span className="text-white font-semibold">{checkoutMethod === 'pickup' ? 'Instant Pickup' : 'Home Delivery'}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-success">
                  <span>Coupon ({appliedCoupon})</span>
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

            {/* Earn Indicator */}
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
              <span className="text-xl">🪙</span>
              <div>
                <p className="text-sm font-semibold text-white">Earn MegaCoins</p>
                <p className="text-xs text-gray-400">
                  You will earn <strong className="text-warning">{megaCoinsEarned} coins</strong> upon delivery!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

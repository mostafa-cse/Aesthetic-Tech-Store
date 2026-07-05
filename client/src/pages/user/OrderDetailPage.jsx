import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
      setReturnRequest(res.data.returnRequest);
    } catch (err) {
      toast.error('Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
        <Link to="/orders" className="text-primary hover:underline">Return to Orders</Link>
      </div>
    );
  }

  // Determine timeline progress
  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
  let currentStepIndex = statuses.indexOf(order.orderStatus);
  if (order.orderStatus === 'cancelled' || order.orderStatus === 'returned') currentStepIndex = -1;

  // Check return eligibility (delivered and within 7 days)
  const isReturnEligible = () => {
    if (order.orderStatus !== 'delivered') return false;
    const deliveryDate = new Date(order.updatedAt); // assuming last update was delivery
    const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        <FiArrowLeft /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Order <span className="font-mono text-primary uppercase">#{order._id.substring(order._id.length - 8)}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {order.orderStatus === 'cancelled' ? (
          <span className="badge-error px-4 py-1.5 text-sm uppercase tracking-wider self-start md:self-auto">
            Cancelled
          </span>
        ) : returnRequest ? (
          <span className="badge-warning px-4 py-1.5 text-sm uppercase tracking-wider self-start md:self-auto flex items-center gap-2">
            Return Requested ({returnRequest.status})
          </span>
        ) : (
          isReturnEligible() && (
            <Link to={`/returns/new?orderId=${order._id}`} className="btn-outline flex items-center gap-2 self-start md:self-auto">
              <FiRefreshCw /> Request Return
            </Link>
          )
        )}
      </div>

      {/* Status Timeline Bar */}
      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
        <div className="card p-6 mb-8 overflow-x-auto">
          <div className="min-w-[500px] relative">
            <div className="absolute left-[10%] right-[10%] top-5 h-1 bg-dark-border z-0" />
            <div 
              className="absolute left-[10%] top-5 h-1 bg-primary z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStepIndex / (statuses.length - 1)) * 80)}%` }}
            />
            
            <div className="flex justify-between relative z-10">
              {[
                { id: 'pending', label: 'Order Placed', icon: FiClock },
                { id: 'processing', label: 'Processing', icon: FiPackage },
                { id: 'shipped', label: 'Shipped', icon: FiTruck },
                { id: 'delivered', label: 'Delivered', icon: FiCheckCircle },
              ].map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isActive = i === currentStepIndex;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 w-1/4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isActive 
                        ? 'bg-primary text-white shadow-glow-sm' 
                        : isCompleted 
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-dark-surface border border-dark-border text-gray-500'
                    }`}>
                      <Icon className="text-lg" />
                    </div>
                    <span className={`text-xs font-semibold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col - Items & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Items */}
          <div className="card p-0 overflow-hidden">
            <h2 className="text-lg font-bold text-white p-5 border-b border-dark-border">Items Ordered</h2>
            <div className="divide-y divide-dark-border">
              {order.items.map((item) => (
                <div key={item.product._id} className="p-5 flex gap-4 sm:gap-6 items-center hover:bg-dark-surface/50 transition-colors">
                  <Link to={`/products/${item.product._id}`} className="shrink-0">
                    <img 
                      src={item.product.images?.[0]?.url || '/placeholder.png'} 
                      alt={item.product.name} 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-dark-muted"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product._id}`}>
                      <h3 className="text-sm font-semibold text-white hover:text-primary transition-colors truncate">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                    {item.isReturned && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">
                        Return Requested
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col - Summary Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Payment & Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FiCreditCard className="text-primary" /> Payment Summary
            </h2>
            
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">৳{order.subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-white">Free</span>
              </div>
              
              {order.couponApplied && (
                <div className="flex justify-between text-success">
                  <span>Coupon</span>
                  <span>-৳{order.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              
              {order.megaCoinsRedeemed > 0 && (
                <div className="flex justify-between text-warning">
                  <span>MegaCoins ({order.megaCoinsRedeemed})</span>
                  <span>-৳{(order.megaCoinsRedeemed / 10).toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-dark-border">
                <span>Total</span>
                <span className="text-primary">৳{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-border">
              <p className="text-xs text-gray-500 mb-1">Payment Method</p>
              <p className="text-sm text-white font-medium">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit Card'}</p>
              
              <p className="text-xs text-gray-500 mt-3 mb-1">Payment Status</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                order.paymentStatus === 'paid' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FiMapPin className="text-primary" /> Shipping Info
            </h2>
            <div className="text-sm space-y-1">
              <p className="text-white font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-gray-400">{order.shippingAddress.phone}</p>
              <p className="text-gray-400 mt-2">{order.shippingAddress.address}</p>
              <p className="text-gray-400">{order.shippingAddress.city}, {order.shippingAddress.district}</p>
              <p className="text-gray-400">{order.shippingAddress.postalCode}</p>
            </div>
          </div>

          {/* Earned Coins */}
          {order.megaCoinsEarned > 0 && (
            <div className="p-4 bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/30 rounded-xl flex items-start gap-3 shadow-glow-sm">
              <span className="text-2xl drop-shadow-lg">🪙</span>
              <div>
                <p className="text-sm font-bold text-white">MegaCoins Earned</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  You earned <span className="text-warning font-bold">+{order.megaCoinsEarned} coins</span> from this order!
                </p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

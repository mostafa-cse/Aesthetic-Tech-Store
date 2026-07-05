import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiEye, FiClock, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import api from '../../utils/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': return { icon: FiClock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
      case 'processing': return { icon: FiPackage, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' };
      case 'shipped': return { icon: FiTruck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
      case 'delivered': return { icon: FiCheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
      case 'cancelled': return { icon: FiXCircle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
      default: return { icon: FiClock, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center w-full sm:w-auto">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-5 w-32 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                </div>
              </div>
              <div className="skeleton h-10 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-dark-card border border-dark-border rounded-full flex items-center justify-center mx-auto mb-6">
          <FiPackage className="text-4xl text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No orders found</h2>
        <p className="text-gray-400 mb-8">You haven't placed any orders yet.</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-8">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = getStatusConfig(order.orderStatus);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={order._id} className="card p-0 overflow-hidden hover:border-primary/30 transition-colors">
              {/* Header */}
              <div className="bg-dark-surface p-4 sm:px-6 border-b border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon className="text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Order <span className="text-white font-mono uppercase">#{order._id.substring(order._id.length - 8)}</span></p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} capitalize`}>
                    {order.orderStatus}
                  </span>
                  <Link to={`/orders/${order._id}`} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-2">
                    <FiEye /> View
                  </Link>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden w-full sm:w-auto">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img 
                      key={i} 
                      src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                      alt={item.product?.name}
                      className="inline-block w-12 h-12 rounded-full border-2 border-dark-card object-cover bg-dark-muted"
                    />
                  ))}
                  {order.items.length > 3 && (
                    <div className="inline-flex w-12 h-12 rounded-full border-2 border-dark-card bg-dark-surface items-center justify-center text-xs text-gray-400 font-semibold z-10">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 text-sm">
                  <div>
                    <p className="text-gray-400">Total Items</p>
                    <p className="font-semibold text-white">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Amount</p>
                    <p className="font-bold text-primary">৳{order.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

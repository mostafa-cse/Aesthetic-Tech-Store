import { useState, useEffect } from 'react';
import { FiEye, FiClock, FiCheckCircle, FiTruck, FiXCircle, FiPackage, FiFilter } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [expandedId, setExpandedId] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin/all');
      setOrders(res.data.orders);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId) => {
    if (!updateStatus) return;
    try {
      await api.put(`/orders/admin/${orderId}/status`, { orderStatus: updateStatus });
      toast.success('Order status updated');
      fetchOrders();
      setExpandedId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.orderStatus === statusFilter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge-warning">Pending</span>;
      case 'processing': return <span className="badge-info">Processing</span>;
      case 'shipped': return <span className="badge-primary">Shipped</span>;
      case 'delivered': return <span className="badge-success">Delivered</span>;
      case 'cancelled': return <span className="badge-error">Cancelled</span>;
      default: return <span className="badge-primary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Order Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and fulfill customer orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1.5 text-sm bg-dark-surface border-dark-border"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-mono text-xs uppercase">
                      {order._id.substring(order._id.length - 8)}
                    </td>
                    <td>
                      <p className="text-sm font-medium text-white">{order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-400">{order.user?.email || 'N/A'}</p>
                    </td>
                    <td className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-sm font-bold text-primary">
                      ৳{order.total.toLocaleString()}
                    </td>
                    <td>
                      {getStatusBadge(order.orderStatus)}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => {
                          if (expandedId === order._id) {
                            setExpandedId(null);
                          } else {
                            setExpandedId(order._id);
                            setUpdateStatus(order.orderStatus);
                          }
                        }}
                        className="btn-ghost text-xs px-2 py-1 flex items-center gap-1 ml-auto"
                      >
                        <FiEye /> {expandedId === order._id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Details Modal/Panel inline for simplicity */}
      {expandedId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-dark-surface border-l border-dark-border h-full overflow-y-auto shadow-2xl p-6">
            {(() => {
              const order = orders.find(o => o._id === expandedId);
              if(!order) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-white">Order Details</h2>
                      <p className="text-xs text-gray-400 font-mono mt-1">ID: {order._id}</p>
                    </div>
                    <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-white">
                      ✕
                    </button>
                  </div>

                  <div className="card p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white border-b border-dark-border pb-2">Update Status</h3>
                    <div className="flex gap-2">
                      <select 
                        value={updateStatus} 
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        className="input text-sm flex-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button onClick={() => handleUpdateStatus(order._id)} className="btn-primary text-sm px-4">
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-white border-b border-dark-border pb-2 mb-3">Customer & Shipping</h3>
                    <div className="text-sm space-y-1 text-gray-300">
                      <p><span className="text-gray-500">Name:</span> {order.shippingAddress.fullName}</p>
                      <p><span className="text-gray-500">Phone:</span> {order.shippingAddress.phone}</p>
                      <p><span className="text-gray-500">Address:</span> {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-white border-b border-dark-border pb-2 mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {order.items.map(item => (
                        <div key={item.product?._id || item._id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <img src={item.product?.images?.[0]?.url || '/placeholder.png'} className="w-10 h-10 rounded bg-dark-muted object-cover" />
                            <div>
                              <p className="text-white line-clamp-1 text-xs">{item.product?.name || 'Unknown Product'}</p>
                              <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-white">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-white border-b border-dark-border pb-2 mb-3">Payment</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-gray-500">Method</span> <span className="text-white">{order.paymentMethod}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span> <span className="text-white">৳{order.subtotal.toLocaleString()}</span></div>
                      {order.couponApplied && (
                         <div className="flex justify-between"><span className="text-success">Coupon</span> <span className="text-success">-৳{order.couponDiscount.toLocaleString()}</span></div>
                      )}
                      {order.megaCoinsRedeemed > 0 && (
                         <div className="flex justify-between"><span className="text-warning">MegaCoins</span> <span className="text-warning">-৳{(order.megaCoinsRedeemed/10).toLocaleString()}</span></div>
                      )}
                      <div className="flex justify-between font-bold border-t border-dark-border pt-2"><span className="text-white">Total</span> <span className="text-primary">৳{order.total.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

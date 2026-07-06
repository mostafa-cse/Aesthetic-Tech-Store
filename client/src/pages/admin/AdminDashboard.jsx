import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FiDollarSign, FiShoppingBag, FiPackage, FiUsers,
  FiAlertTriangle, FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/* ── Custom Tooltip ───────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-4 py-3 shadow-card text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-primary font-bold">৳{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

/* ── Stat Card ────────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, gradient, iconColor, sub, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="card relative overflow-hidden"
  >
    <div className={`absolute inset-0 opacity-10 ${gradient}`} />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} bg-opacity-30 border border-white/10`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/orders/admin/analytics');
        setAnalytics(data);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  /* ── Skeleton Loading ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 card">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="card space-y-3">
            <Skeleton className="h-6 w-32 mb-2" />
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: FiDollarSign,
      label: 'Total Revenue',
      value: `৳${(analytics?.totalRevenue ?? 0).toLocaleString()}`,
      gradient: 'bg-gradient-to-br from-primary to-primary/50',
      iconColor: 'text-primary-300',
      sub: `${analytics?.totalOrders ?? 0} orders`,
    },
    {
      icon: FiShoppingBag,
      label: 'Total Orders',
      value: (analytics?.totalOrders ?? 0).toLocaleString(),
      gradient: 'bg-gradient-to-br from-accent to-accent/50',
      iconColor: 'text-accent',
      sub: `${analytics?.pendingOrders ?? 0} pending`,
    },
    {
      icon: FiPackage,
      label: 'Total Products',
      value: (analytics?.totalProducts ?? 0).toLocaleString(),
      gradient: 'bg-gradient-to-br from-warning to-warning/50',
      iconColor: 'text-warning',
      sub: `${analytics?.lowStockProducts ?? 0} low stock`,
    },
    {
      icon: FiUsers,
      label: 'Total Users',
      value: (analytics?.totalUsers ?? 0).toLocaleString(),
      gradient: 'bg-gradient-to-br from-info to-info/50',
      iconColor: 'text-info',
      sub: 'registered customers',
    },
  ];

  const weeklyData = analytics?.weeklyRevenue ?? [];
  const topProducts = analytics?.topProducts ?? [];
  const lowStockItems = analytics?.lowStockItems ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-brand">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2 badge-accent px-3 py-1.5">
          <FiTrendingUp />
          <span className="text-xs font-semibold">Live Data</span>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* ── Low Stock Alert ──────────────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3"
        >
          <FiAlertTriangle className="text-warning text-xl shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-warning font-semibold text-sm mb-1">
              Low Stock Alert — {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} need restocking
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span key={item._id} className="badge-warning text-xs">
                  {item.name} ({item.stock} left)
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Chart + Top Products ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Weekly Revenue</h2>
              <p className="text-xs text-gray-400">Last 7 days performance</p>
            </div>
            <span className="badge-primary text-xs">৳ BDT</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6C63FF"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ fill: '#6C63FF', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#00D4AA' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Top Products</h2>
            <span className="text-xs text-gray-500">By revenue</span>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : (
              topProducts.slice(0, 5).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-muted/30 transition-colors">
                  <span className="text-xs font-bold text-gray-600 w-4 shrink-0">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-dark-muted overflow-hidden shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]?.url || (typeof p.images[0] === 'string' ? p.images[0] : '/placeholder.png')} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <FiPackage />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.soldCount ?? 0} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-accent">৳{(p.revenue ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Order Value', value: `৳${(analytics?.avgOrderValue ?? 0).toLocaleString()}` },
          { label: 'Delivered Orders', value: analytics?.deliveredOrders ?? 0 },
          { label: 'Cancelled Orders', value: analytics?.cancelledOrders ?? 0 },
          { label: 'Total Returns', value: analytics?.totalReturns ?? 0 },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="bg-dark-surface border border-dark-border rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

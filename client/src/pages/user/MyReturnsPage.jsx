import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiChevronDown, FiChevronUp, FiArrowRight,
  FiExternalLink, FiAlertCircle, FiCheck, FiClock, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'status-pending',
    step: 0,
  },
  approved: {
    label: 'Approved',
    color: 'badge bg-blue-500/20 text-blue-400',
    step: 1,
  },
  'items-received': {
    label: 'Items Received',
    color: 'badge bg-purple-500/20 text-purple-400',
    step: 2,
  },
  refund_processed: {
    label: 'Refund Processed',
    color: 'status-delivered',
    step: 3,
  },
  rejected: {
    label: 'Rejected',
    color: 'status-cancelled',
    step: -1,
  },
};

const TIMELINE_STEPS = [
  { key: 'pending',         label: 'Request Submitted', icon: FiPackage },
  { key: 'approved',        label: 'Request Approved',  icon: FiCheck },
  { key: 'items-received',  label: 'Items Received',    icon: FiClock },
  { key: 'refund_processed',label: 'Refund Processed',  icon: FiCheck },
];

const REASON_LABELS = {
  'defective':           '🔧 Defective / Not Working',
  'wrong-item':          '📦 Wrong Item Received',
  'not-as-described':    '📄 Not As Described',
  'damaged-in-shipping': '💥 Damaged in Shipping',
  'changed-mind':        '🔄 Changed Mind',
  'other':               '💬 Other',
};

/* ─── Timeline Component ─────────────────────────────────────────────────── */
function ReturnTimeline({ status }) {
  const config = STATUS_CONFIG[status];
  const currentStep = config?.step ?? 0;
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-8 h-8 rounded-full bg-error/20 border border-error/30 flex items-center justify-center">
          <FiX className="text-error text-sm" />
        </div>
        <div>
          <p className="text-sm font-medium text-error">Return Rejected</p>
          <p className="text-xs text-gray-500">Please check the admin note below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2 scrollbar-hide">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentStep;
        const active = i === currentStep;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  done
                    ? 'bg-primary border-primary text-white'
                    : 'border-dark-border text-gray-600 bg-dark-muted'
                } ${active ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-dark-card' : ''}`}
              >
                <step.icon className="text-xs" />
              </div>
              <span className={`text-xs mt-1 text-center leading-tight ${done ? 'text-primary' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 mx-1 shrink-0 ${i < currentStep ? 'bg-primary' : 'bg-dark-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Return Card ────────────────────────────────────────────────────────── */
function ReturnCard({ ret }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[ret.status] || STATUS_CONFIG.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">
              Return #{ret._id?.slice(-8).toUpperCase()}
            </span>
            <span className={config.color}>{config.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span>
              Order:{' '}
              <Link to={`/orders/${ret.order?._id || ret.order}`} className="text-primary hover:underline inline-flex items-center gap-0.5">
                #{(ret.order?._id || ret.order)?.toString().slice(-8).toUpperCase()}
                <FiExternalLink className="text-xs" />
              </Link>
            </span>
            <span>•</span>
            <span>{new Date(ret.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>•</span>
            <span>{ret.items?.length || 0} item(s)</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-muted transition-colors"
        >
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {/* Timeline preview */}
      <div className="mt-4 overflow-x-auto">
        <ReturnTimeline status={ret.status} />
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-dark-border space-y-5">
              {/* Items */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Returned Items</h4>
                <div className="space-y-2">
                  {(ret.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-muted/50">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-muted shrink-0">
                        <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.name || 'Product'}</p>
                        {item.quantity && <p className="text-xs text-gray-500">Qty: {item.quantity}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason</h4>
                  <p className="text-sm text-gray-300">{REASON_LABELS[ret.reason] || ret.reason}</p>
                  {ret.reasonDetail && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ret.reasonDetail}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Refund Method</h4>
                  <p className="text-sm text-gray-300">
                    {ret.refundMethod === 'megacoin' ? '🪙 MegaCoins Credit' : '💳 Original Payment'}
                  </p>
                  {ret.refundAmount && (
                    <p className="text-xs text-success mt-1">
                      Refund: ৳{ret.refundAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Evidence Photos */}
              {ret.evidence?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Evidence Photos</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ret.evidence.map((photo, i) => (
                      <a
                        key={i}
                        href={photo.url || photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-dark-muted border border-dark-border hover:border-primary/50 transition-colors group"
                      >
                        <img
                          src={photo.url || photo}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Note */}
              {ret.adminNote && (
                <div className={`p-4 rounded-xl border flex gap-3 ${
                  ret.status === 'rejected'
                    ? 'bg-error/10 border-error/20'
                    : 'bg-info/10 border-info/20'
                }`}>
                  <FiAlertCircle className={`shrink-0 mt-0.5 ${ret.status === 'rejected' ? 'text-error' : 'text-info'}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-300 mb-1">Admin Note</p>
                    <p className="text-sm text-gray-300">{ret.adminNote}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MyReturnsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const load = async () => {
      try {
        const { data } = await api.get('/returns/my');
        setReturns(data.returns || []);
      } catch {
        toast.error('Failed to load returns');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate]);

  const filtered = filter === 'all'
    ? returns
    : returns.filter((r) => r.status === filter);

  const FILTERS = [
    { value: 'all',             label: 'All' },
    { value: 'pending',         label: 'Pending' },
    { value: 'approved',        label: 'Approved' },
    { value: 'refund_processed',label: 'Refunded' },
    { value: 'rejected',        label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-brand font-bold text-white">My Returns</h1>
              <p className="text-gray-400 text-sm mt-1">Track your return requests and refunds</p>
            </div>
            <Link to="/orders" className="btn-ghost flex items-center gap-2 text-sm">
              My Orders <FiArrowRight />
            </Link>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-primary text-white shadow-glow-sm'
                  : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({returns.filter((r) => r.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <FiPackage className="text-5xl text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-300">
              {filter === 'all' ? 'No return requests yet' : `No ${filter} returns`}
            </p>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              {filter === 'all'
                ? 'If you need to return an item, go to your orders page.'
                : 'Try selecting a different filter.'}
            </p>
            {filter === 'all' && (
              <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
                <FiPackage /> My Orders
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ret) => (
              <ReturnCard key={ret._id} ret={ret} />
            ))}
          </div>
        )}

        {/* Stats summary */}
        {!loading && returns.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: 'Total',    value: returns.length,                                color: 'text-white' },
              { label: 'Pending',  value: returns.filter((r) => r.status === 'pending').length,  color: 'text-warning' },
              { label: 'Approved', value: returns.filter((r) => r.status === 'approved' || r.status === 'refund_processed').length, color: 'text-success' },
              { label: 'Rejected', value: returns.filter((r) => r.status === 'rejected').length, color: 'text-error' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold font-brand ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

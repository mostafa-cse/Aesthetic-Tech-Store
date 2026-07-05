import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const TypeBadge = ({ type }) =>
  type === 'percentage'
    ? <span className="badge-primary">% Off</span>
    : <span className="badge-accent">Flat ৳</span>;

const StatusBadge = ({ active }) =>
  active
    ? <span className="badge-success">Active</span>
    : <span className="badge-error">Inactive</span>;

const emptyForm = {
  code: '', type: 'percentage', value: '', minPurchase: '',
  maxDiscount: '', expiry: '', usageLimit: '', description: '',
};

/* ── Coupon Modal ─────────────────────────────────────────────────────────── */
const CouponModal = ({ coupon, onClose, onSaved }) => {
  const isEdit = !!coupon?._id;
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        code: coupon.code || '',
        type: coupon.type || 'percentage',
        value: coupon.value ?? '',
        minPurchase: coupon.minPurchase ?? '',
        maxDiscount: coupon.maxDiscount ?? '',
        expiry: coupon.expiry ? coupon.expiry.slice(0, 10) : '',
        usageLimit: coupon.usageLimit ?? '',
        description: coupon.description || '',
      };
    }
    return { ...emptyForm };
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit) {
        await api.put(`/coupons/admin/${coupon._id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/coupons/admin', payload);
        toast.success('Coupon created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative bg-dark-surface border border-dark-border rounded-2xl shadow-card w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiTag className="text-primary" />
            {isEdit ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors">
            <FiX />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="input-label col-span-2">Coupon Code *
              <input
                className="input mt-1 uppercase"
                placeholder="SAVE20"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                required
              />
            </label>
            <label className="input-label">Type *
              <select className="input mt-1" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (৳)</option>
              </select>
            </label>
            <label className="input-label">
              {form.type === 'percentage' ? 'Discount % *' : 'Flat Amount (৳) *'}
              <input className="input mt-1" type="number" min="0" value={form.value}
                onChange={(e) => set('value', e.target.value)} required />
            </label>
            <label className="input-label">Min Purchase (৳)
              <input className="input mt-1" type="number" min="0" value={form.minPurchase}
                onChange={(e) => set('minPurchase', e.target.value)} />
            </label>
            {form.type === 'percentage' && (
              <label className="input-label">Max Discount (৳)
                <input className="input mt-1" type="number" min="0" value={form.maxDiscount}
                  onChange={(e) => set('maxDiscount', e.target.value)} />
              </label>
            )}
            <label className="input-label">Expiry Date *
              <input className="input mt-1" type="date" value={form.expiry}
                onChange={(e) => set('expiry', e.target.value)} required />
            </label>
            <label className="input-label">Usage Limit
              <input className="input mt-1" type="number" min="1" value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" />
            </label>
          </div>
          <label className="input-label">Description
            <textarea className="input mt-1 resize-none min-h-[60px]" value={form.description}
              onChange={(e) => set('description', e.target.value)} />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Delete Dialog ────────────────────────────────────────────────────────── */
const DeleteDialog = ({ coupon, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await api.delete(`/coupons/admin/${coupon._id}`);
      toast.success('Coupon deleted');
      onDeleted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-dark-card border border-dark-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-card"
      >
        <h3 className="text-lg font-bold text-white mb-2">Delete Coupon?</h3>
        <p className="text-gray-400 text-sm mb-6">
          Coupon <strong className="text-white">"{coupon.code}"</strong> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={confirm} disabled={loading} className="btn-danger flex-1">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggling, setToggling] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/coupons/admin');
      setCoupons(data.coupons ?? data);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const toggleActive = async (coupon) => {
    setToggling(coupon._id);
    try {
      await api.patch(`/coupons/admin/${coupon._id}/toggle`);
      setCoupons((prev) =>
        prev.map((c) => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c)
      );
    } catch {
      toast.error('Failed to toggle coupon');
    } finally {
      setToggling(null);
    }
  };

  const filtered = coupons.filter((c) =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditCoupon(null); setShowModal(true); };
  const openEdit = (c) => { setEditCoupon(c); setShowModal(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-brand">Coupons</h1>
          <p className="text-gray-400 text-sm">{coupons.length} coupons</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus /> Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search coupons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Purchase</th>
                <th>Expiry</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
                : filtered.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="font-mono text-white font-bold tracking-widest text-sm">{c.code}</span>
                      {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    </td>
                    <td><TypeBadge type={c.type} /></td>
                    <td className="font-semibold text-white">
                      {c.type === 'percentage' ? `${c.value}%` : `৳${c.value?.toLocaleString()}`}
                      {c.maxDiscount ? <span className="text-xs text-gray-500 ml-1">(max ৳{c.maxDiscount})</span> : null}
                    </td>
                    <td className="text-gray-300">
                      {c.minPurchase ? `৳${c.minPurchase?.toLocaleString()}` : '—'}
                    </td>
                    <td className="text-gray-300">
                      {c.expiry ? new Date(c.expiry).toLocaleDateString('en-BD') : '—'}
                      {c.expiry && new Date(c.expiry) < new Date() && (
                        <span className="ml-1 badge-error text-xs">Expired</span>
                      )}
                    </td>
                    <td className="text-gray-300">
                      {c.usedCount ?? 0} / {c.usageLimit ?? '∞'}
                    </td>
                    <td>
                      <button
                        disabled={toggling === c._id}
                        onClick={() => toggleActive(c)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${c.isActive ? 'bg-success' : 'bg-dark-muted'} disabled:opacity-60`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${c.isActive ? 'translate-x-5' : ''}`} />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">No coupons found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <CouponModal
            coupon={editCoupon}
            onClose={() => { setShowModal(false); setEditCoupon(null); }}
            onSaved={() => { setShowModal(false); setEditCoupon(null); fetchCoupons(); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            coupon={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => { setDeleteTarget(null); fetchCoupons(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

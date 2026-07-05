import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiMapPin, FiPackage, FiCamera, FiSave, FiLock,
  FiPlus, FiTrash2, FiHome, FiCheck, FiEye, FiEyeOff,
  FiArrowRight, FiX, FiAlertCircle, FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { fetchMe } from '../../features/auth/authSlice';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'profile',   label: 'Profile',    icon: FiUser },
  { id: 'addresses', label: 'Addresses',  icon: FiMapPin },
  { id: 'megacoins', label: 'MegaCoins',  icon: null, emoji: '🪙' },
  { id: 'orders',    label: 'Orders',     icon: FiPackage },
];

const STATUS_CLASSES = {
  pending:    'status-pending',
  processing: 'status-processing',
  shipped:    'status-shipped',
  delivered:  'status-delivered',
  cancelled:  'status-cancelled',
};

function StatusBadge({ status }) {
  return (
    <span className={STATUS_CLASSES[status] || 'badge bg-gray-500/20 text-gray-400'}>
      {status}
    </span>
  );
}

/* ─── Address Modal ───────────────────────────────────────────────────────── */
const EMPTY_ADDR = {
  label: '', fullName: '', phone: '', address: '',
  city: '', district: '', postalCode: '', isDefault: false,
};

function AddressModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_ADDR);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(EMPTY_ADDR); }, [open]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users/addresses', form);
      toast.success('Address saved!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg card max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Add New Address</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-muted transition-colors">
                <FiX />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Label</label>
                  <select name="label" value={form.label} onChange={handle} className="input" required>
                    <option value="">Select…</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handle} className="input" required placeholder="Recipient name" />
                </div>
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input name="phone" value={form.phone} onChange={handle} className="input" required placeholder="+880..." />
              </div>
              <div>
                <label className="input-label">Address</label>
                <input name="address" value={form.address} onChange={handle} className="input" required placeholder="Street address, house no." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">City</label>
                  <input name="city" value={form.city} onChange={handle} className="input" required placeholder="City" />
                </div>
                <div>
                  <label className="input-label">District</label>
                  <input name="district" value={form.district} onChange={handle} className="input" required placeholder="District" />
                </div>
                <div>
                  <label className="input-label">Postal Code</label>
                  <input name="postalCode" value={form.postalCode} onChange={handle} className="input" required placeholder="1200" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-11 h-6 rounded-full transition-colors relative ${form.isDefault ? 'bg-primary' : 'bg-dark-muted'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handle} className="sr-only" />
                </div>
                <span className="text-sm text-gray-300">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Tab: Profile ───────────────────────────────────────────────────────── */
function ProfileTab({ user, onRefresh }) {
  const fileRef = useRef();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState({ cur: false, new: false, conf: false });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await api.post('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Avatar updated!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Avatar upload failed');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.post('/users/profile', form, { headers: { 'Content-Type': 'application/json' } });
      toast.success('Profile updated!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Avatar */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dark-border group-hover:border-primary/50 transition-colors">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <FiCamera className="text-white text-xl" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <button onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-primary hover:text-primary-300 transition-colors flex items-center gap-1">
              <FiCamera className="text-xs" /> Click photo to change
            </button>
          </div>
        </div>
      </div>

      {/* Info form */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">Personal Information</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="input" required placeholder="Your full name"
              />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="input" placeholder="+880..."
              />
            </div>
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input value={user?.email || ''} disabled className="input opacity-50 cursor-not-allowed" />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
              <FiSave className="text-sm" />
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FiLock className="text-primary" /> Change Password
        </h3>
        <form onSubmit={savePassword} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', show: 'cur' },
            { key: 'newPassword',     label: 'New Password',     show: 'new' },
            { key: 'confirmPassword', label: 'Confirm New Password', show: 'conf' },
          ].map(({ key, label, show }) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <div className="relative">
                <input
                  type={showPw[show] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, [show]: !p[show] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPw[show] ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" disabled={savingPw} className="btn-outline flex items-center gap-2">
              <FiLock className="text-sm" />
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

/* ─── Tab: Addresses ─────────────────────────────────────────────────────── */
function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/addresses');
      setAddresses(data.addresses || []);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteAddr = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Saved Addresses</h3>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <FiPlus /> Add Address
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="card text-center py-12">
          <FiMapPin className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No saved addresses</p>
          <p className="text-sm text-gray-600 mt-1">Add an address for faster checkout</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
            <FiPlus /> Add First Address
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <motion.div
              key={addr._id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <FiHome className="text-primary text-sm" />
                  </div>
                  <span className="font-semibold text-white text-sm">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="badge-accent text-xs flex items-center gap-1">
                      <FiCheck className="text-xs" /> Default
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteAddr(addr._id)}
                  className="p-1.5 text-gray-600 hover:text-error rounded-lg hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
              <p className="text-sm font-medium text-gray-200">{addr.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{addr.phone}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {addr.address}, {addr.city}, {addr.district} {addr.postalCode}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <AddressModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </motion.div>
  );
}

/* ─── Tab: MegaCoins ─────────────────────────────────────────────────────── */
const TX_ICON = { earn: '🟢', redeem: '🔴', admin: '⚙️', refund: '🔵' };

function MegaCoinsTab({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/megacoin/my');
        setData(res.data);
      } catch {
        toast.error('Failed to load MegaCoin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const balance = data?.balance ?? user?.megaCoinBalance ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-warning/20 via-dark-card to-primary/20 border border-warning/30 p-8">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-warning/10 rounded-full blur-3xl" />
        <div className="absolute -left-4 bottom-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-6xl mb-4 inline-block"
          >
            🪙
          </motion.div>
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-5xl font-brand font-black text-warning"
          >
            {loading ? '…' : balance.toLocaleString()}
          </motion.p>
          <p className="text-gray-300 mt-1 font-medium">MegaCoins Balance</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>৳10 spent = 🪙 1 coin</span>
            <span className="text-dark-border">|</span>
            <span>🪙 10 coins = ৳1 off</span>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-white">Transaction History</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : !data?.transactions?.length ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🪙</p>
            <p className="font-medium">No transactions yet</p>
            <p className="text-xs mt-1">Start shopping to earn MegaCoins!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Order</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <span className="flex items-center gap-2 text-sm">
                        <span>{TX_ICON[tx.type] || '⚙️'}</span>
                        <span className={tx.type === 'earn' ? 'text-success' : tx.type === 'redeem' ? 'text-error' : 'text-gray-400'}>
                          {tx.type}
                        </span>
                      </span>
                    </td>
                    <td className="text-gray-300 max-w-xs truncate">{tx.description || '—'}</td>
                    <td>
                      <span className={`font-semibold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                      </span>
                    </td>
                    <td className="font-medium text-warning">{tx.balanceAfter} 🪙</td>
                    <td>
                      {tx.order ? (
                        <Link to={`/orders/${tx.order}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                          #{tx.order.toString().slice(-6)} <FiExternalLink />
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="text-gray-500 text-xs whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Tab: Orders ────────────────────────────────────────────────────────── */
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/orders/my?limit=5');
        setOrders(data.orders || []);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Recent Orders</h3>
        <Link to="/orders" className="text-sm text-primary hover:text-primary-300 transition-colors flex items-center gap-1">
          View All <FiArrowRight className="text-xs" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <FiPackage className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No orders yet</p>
          <Link to="/products" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
            Browse Products <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {order.items?.slice(0, 3).map((item) => (
                      <div key={item._id} className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-lg bg-dark-muted overflow-hidden">
                          <img
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-400 truncate max-w-[100px]">{item.name}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="text-xs text-gray-500">+{order.items.length - 3} more</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-white font-semibold">৳{order.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>
                <Link
                  to={`/orders/${order._id}`}
                  className="shrink-0 text-xs text-primary hover:text-primary-300 transition-colors flex items-center gap-1"
                >
                  Details <FiArrowRight />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('profile');

  // Support ?tab=megacoins from navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && TABS.find((t) => t.id === tab)) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const refresh = () => dispatch(fetchMe());

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-brand font-bold text-white">My Account</h1>
          <p className="text-gray-400 mt-1">Manage your profile, addresses, and orders</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <aside className="md:w-56 shrink-0">
            <div className="card p-2 space-y-1">
              {/* User summary */}
              <div className="px-3 py-3 mb-2 border-b border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <div className="megacoin-chip mt-0.5 text-xs">🪙 {user.megaCoinBalance || 0}</div>
                  </div>
                </div>
              </div>

              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-gray-400 hover:text-white hover:bg-dark-muted'
                  }`}
                >
                  {tab.icon ? <tab.icon className="text-sm shrink-0" /> : <span className="text-sm">{tab.emoji}</span>}
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'profile'   && <ProfileTab user={user} onRefresh={refresh} />}
            {activeTab === 'addresses' && <AddressesTab />}
            {activeTab === 'megacoins' && <MegaCoinsTab user={user} />}
            {activeTab === 'orders'    && <OrdersTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

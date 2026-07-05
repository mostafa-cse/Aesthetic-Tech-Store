import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiImage,
  FiUpload, FiMinus, FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  'Laptops', 'Desktops', 'PC Components', 'Peripherals',
  'Networking', 'Storage', 'Audio', 'Monitors', 'Mobile', 'Accessories',
];

const UNIT_OPTIONS = ['days', 'months', 'years'];

const StockBadge = ({ stock }) => {
  if (stock === 0) return <span className="badge-error">Out of Stock</span>;
  if (stock < 5) return <span className="badge-warning">Low: {stock}</span>;
  return <span className="badge-success">In Stock: {stock}</span>;
};

const emptyForm = {
  name: '', category: '', brand: '', model: '', description: '',
  regularPrice: '', discountPrice: '', stock: '', sku: '',
  configurations: [],
  guaranteeDuration: '', guaranteeUnit: 'months', guaranteeTerms: '',
  warrantyDuration: '', warrantyUnit: 'months', warrantyTerms: '',
  returnEligible: true, returnWindowDays: 7, returnConditions: '',
  megaCoinRewardRate: '', tags: '', isFeatured: false,
};

/* ── Image Uploader ───────────────────────────────────────────────────────── */
const ImageUploader = ({ files, setFiles }) => {
  const inputRef = useRef();
  const previews = files.map((f) => {
    if (typeof f === 'string') return f;
    return URL.createObjectURL(f);
  });
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {previews.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-dark-border group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 right-0.5 bg-error/80 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiX className="text-xs" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-dark-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-primary transition-colors"
        >
          <FiUpload className="text-lg" />
          <span className="text-xs">Add</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
      />
    </div>
  );
};

/* ── Product Form Modal ───────────────────────────────────────────────────── */
const ProductModal = ({ product, onClose, onSaved }) => {
  const isEdit = !!product?._id;
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        description: product.description || '',
        regularPrice: product.regularPrice || '',
        discountPrice: product.discountPrice || '',
        stock: product.stock ?? '',
        sku: product.sku || '',
        configurations: product.configurations
          ? Object.entries(product.configurations).map(([k, v]) => ({ key: k, value: String(v) }))
          : [],
        guaranteeDuration: product.guarantee?.duration || '',
        guaranteeUnit: product.guarantee?.unit || 'months',
        guaranteeTerms: product.guarantee?.terms || '',
        warrantyDuration: product.warranty?.duration || '',
        warrantyUnit: product.warranty?.unit || 'months',
        warrantyTerms: product.warranty?.terms || '',
        returnEligible: product.returnPolicy?.eligible ?? true,
        returnWindowDays: product.returnPolicy?.windowDays ?? 7,
        returnConditions: product.returnPolicy?.conditions || '',
        megaCoinRewardRate: product.megaCoinRewardRate || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        isFeatured: product.isFeatured || false,
      };
    }
    return { ...emptyForm };
  });
  const [imageFiles, setImageFiles] = useState(
    isEdit ? (product.images || []) : []
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addSpec = () => setForm((f) => ({
    ...f,
    configurations: [...f.configurations, { key: '', value: '' }],
  }));
  const updateSpec = (i, field, val) => setForm((f) => {
    const c = [...f.configurations];
    c[i] = { ...c[i], [field]: val };
    return { ...f, configurations: c };
  });
  const removeSpec = (i) => setForm((f) => ({
    ...f,
    configurations: f.configurations.filter((_, idx) => idx !== i),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'configurations' || k === 'imageFiles') return;
        fd.append(k, typeof v === 'boolean' ? String(v) : v);
      });

      // configs as JSON
      const configObj = {};
      form.configurations.forEach(({ key, value }) => {
        if (key.trim()) configObj[key.trim()] = value;
      });
      fd.append('configurations', JSON.stringify(configObj));

      // images
      imageFiles.forEach((f) => {
        if (f instanceof File) fd.append('images', f);
        else fd.append('existingImages', f);
      });

      if (isEdit) {
        await api.put(`/products/admin/${product._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated!');
      } else {
        await api.post('/products/admin/create', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const TABS = ['basic', 'pricing', 'specs', 'guarantee', 'warranty', 'returns', 'extra'];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28 }}
        className="relative ml-auto w-full max-w-2xl h-full bg-dark-surface border-l border-dark-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-dark-border shrink-0 px-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ── Basic ─────────────────────────────────────────────────── */}
          {tab === 'basic' && (
            <>
              <label className="input-label">Product Name *
                <input className="input mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="input-label">Category *
                  <select className="input mt-1" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="input-label">Brand *
                  <input className="input mt-1" value={form.brand} onChange={(e) => set('brand', e.target.value)} required />
                </label>
              </div>
              <label className="input-label">Model
                <input className="input mt-1" value={form.model} onChange={(e) => set('model', e.target.value)} />
              </label>
              <label className="input-label">Description
                <textarea
                  className="input mt-1 min-h-[100px] resize-none"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </label>
              <div>
                <p className="input-label mb-2">Product Images</p>
                <ImageUploader files={imageFiles} setFiles={setImageFiles} />
              </div>
            </>
          )}

          {/* ── Pricing ───────────────────────────────────────────────── */}
          {tab === 'pricing' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <label className="input-label">Regular Price (৳) *
                  <input className="input mt-1" type="number" min="0" value={form.regularPrice}
                    onChange={(e) => set('regularPrice', e.target.value)} required />
                </label>
                <label className="input-label">Discount Price (৳)
                  <input className="input mt-1" type="number" min="0" value={form.discountPrice}
                    onChange={(e) => set('discountPrice', e.target.value)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="input-label">Stock *
                  <input className="input mt-1" type="number" min="0" value={form.stock}
                    onChange={(e) => set('stock', e.target.value)} required />
                </label>
                <label className="input-label">SKU
                  <input className="input mt-1" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                </label>
              </div>
            </>
          )}

          {/* ── Specs ─────────────────────────────────────────────────── */}
          {tab === 'specs' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Configurations</p>
                <button type="button" onClick={addSpec}
                  className="flex items-center gap-1.5 text-xs btn-outline px-3 py-1.5">
                  <FiPlus /> Add Spec
                </button>
              </div>
              {form.configurations.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">No specs added yet</p>
              )}
              <div className="space-y-2">
                {form.configurations.map((spec, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      placeholder="Key (e.g. RAM)"
                      value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                    />
                    <input
                      className="input flex-1"
                      placeholder="Value (e.g. 16GB)"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    />
                    <button type="button" onClick={() => removeSpec(i)}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                      <FiMinus />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Guarantee ─────────────────────────────────────────────── */}
          {tab === 'guarantee' && (
            <>
              <p className="text-xs text-gray-400 mb-2">Manufacturer guarantee (e.g. 1 year)</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="input-label">Duration
                  <input className="input mt-1" type="number" min="0" value={form.guaranteeDuration}
                    onChange={(e) => set('guaranteeDuration', e.target.value)} />
                </label>
                <label className="input-label">Unit
                  <select className="input mt-1" value={form.guaranteeUnit}
                    onChange={(e) => set('guaranteeUnit', e.target.value)}>
                    {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <label className="input-label">Guarantee Terms
                <textarea className="input mt-1 resize-none min-h-[80px]" value={form.guaranteeTerms}
                  onChange={(e) => set('guaranteeTerms', e.target.value)} />
              </label>
            </>
          )}

          {/* ── Warranty ──────────────────────────────────────────────── */}
          {tab === 'warranty' && (
            <>
              <p className="text-xs text-gray-400 mb-2">Seller warranty</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="input-label">Duration
                  <input className="input mt-1" type="number" min="0" value={form.warrantyDuration}
                    onChange={(e) => set('warrantyDuration', e.target.value)} />
                </label>
                <label className="input-label">Unit
                  <select className="input mt-1" value={form.warrantyUnit}
                    onChange={(e) => set('warrantyUnit', e.target.value)}>
                    {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <label className="input-label">Warranty Terms
                <textarea className="input mt-1 resize-none min-h-[80px]" value={form.warrantyTerms}
                  onChange={(e) => set('warrantyTerms', e.target.value)} />
              </label>
            </>
          )}

          {/* ── Returns ───────────────────────────────────────────────── */}
          {tab === 'returns' && (
            <>
              <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-dark-border">
                <span className="text-sm text-white">Return Eligible</span>
                <button
                  type="button"
                  onClick={() => set('returnEligible', !form.returnEligible)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.returnEligible ? 'bg-primary' : 'bg-dark-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.returnEligible ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              {form.returnEligible && (
                <>
                  <label className="input-label">Return Window (days)
                    <input className="input mt-1" type="number" min="1" value={form.returnWindowDays}
                      onChange={(e) => set('returnWindowDays', e.target.value)} />
                  </label>
                  <label className="input-label">Return Conditions
                    <textarea className="input mt-1 resize-none min-h-[80px]" value={form.returnConditions}
                      onChange={(e) => set('returnConditions', e.target.value)} />
                  </label>
                </>
              )}
            </>
          )}

          {/* ── Extra ─────────────────────────────────────────────────── */}
          {tab === 'extra' && (
            <>
              <label className="input-label">🪙 MegaCoin Reward Rate
                <input className="input mt-1" type="number" min="0" step="0.01"
                  placeholder="e.g. 0.1 (coins per ৳ spent)"
                  value={form.megaCoinRewardRate}
                  onChange={(e) => set('megaCoinRewardRate', e.target.value)} />
              </label>
              <label className="input-label">Tags (comma-separated)
                <input className="input mt-1" placeholder="gaming, rgb, mechanical" value={form.tags}
                  onChange={(e) => set('tags', e.target.value)} />
              </label>
              <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-dark-border">
                <span className="text-sm text-white">Featured Product</span>
                <button
                  type="button"
                  onClick={() => set('isFeatured', !form.isFeatured)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-primary' : 'bg-dark-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isFeatured ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-border flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            type="submit"
            form="product-form"
            disabled={saving}
            className="btn-primary flex-1"
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Delete Dialog ────────────────────────────────────────────────────────── */
const DeleteDialog = ({ product, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await api.delete(`/products/admin/${product._id}`);
      toast.success('Product deleted');
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
        <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
        <p className="text-gray-400 text-sm mb-6">
          <strong className="text-white">"{product.name}"</strong> will be permanently removed.
          This action cannot be undone.
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
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState(null); // null=closed, {}=new, {...}=edit
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products?admin=true&limit=200');
      setProducts(data.products ?? data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setModalProduct({}); setShowModal(true); };
  const openEdit = (p) => { setModalProduct(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalProduct(null); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-brand">Products</h1>
          <p className="text-gray-400 text-sm">{products.length} products</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search products…"
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
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Regular Price</th>
                <th>Discount</th>
                <th>Stock</th>
                <th>Warranty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
                : filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-muted overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <FiPackage />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm max-w-[160px] truncate">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-500">{p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-info">{p.category}</span></td>
                    <td className="text-gray-300">{p.brand}</td>
                    <td className="text-white font-semibold">৳{p.regularPrice?.toLocaleString()}</td>
                    <td>
                      {p.discountPrice
                        ? <span className="text-accent font-semibold">৳{p.discountPrice?.toLocaleString()}</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                    <td><StockBadge stock={p.stock ?? 0} /></td>
                    <td className="text-gray-400 text-xs">
                      {p.warranty?.duration
                        ? `${p.warranty.duration} ${p.warranty.unit}`
                        : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && modalProduct !== null && (
          <ProductModal
            product={modalProduct}
            onClose={closeModal}
            onSaved={() => { closeModal(); fetchProducts(); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            product={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => { setDeleteTarget(null); fetchProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

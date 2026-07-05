import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  FiPackage, FiChevronRight, FiUploadCloud, FiX, FiAlertCircle,
  FiCheck, FiArrowLeft, FiImage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/* ─── constants ──────────────────────────────────────────────────────────── */
const REASONS = [
  { value: 'defective',           label: '🔧 Defective / Not Working' },
  { value: 'wrong-item',          label: '📦 Wrong Item Received' },
  { value: 'not-as-described',    label: '📄 Not As Described' },
  { value: 'damaged-in-shipping', label: '💥 Damaged in Shipping' },
  { value: 'changed-mind',        label: '🔄 Changed Mind' },
  { value: 'other',               label: '💬 Other' },
];

const REFUND_METHODS = [
  {
    value: 'original-payment',
    label: 'Original Payment Method',
    desc: 'Refund to your original payment method (3-7 business days)',
    icon: '💳',
  },
  {
    value: 'megacoin',
    label: 'MegaCoins Credit',
    desc: 'Instant credit to your MegaCoin wallet (bonus 5% extra!)',
    icon: '🪙',
  },
];

const STEPS = ['Select Items', 'Reason & Evidence', 'Review & Submit'];

/* ─── Evidence Dropzone ──────────────────────────────────────────────────── */
function EvidenceDropzone({ files, onChange }) {
  const onDrop = useCallback((accepted) => {
    onChange((prev) => {
      const all = [...prev, ...accepted];
      return all.slice(0, 5); // max 5
    });
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
  });

  const remove = (idx) => onChange((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-dark-border hover:border-primary/50 hover:bg-dark-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className={`text-4xl mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-gray-500'}`} />
        <p className="text-gray-300 font-medium">
          {isDragActive ? 'Drop files here…' : 'Drag & drop photos here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse (max 5 photos, 5MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-dark-muted border border-dark-border">
              <img
                src={URL.createObjectURL(file)}
                alt={`Evidence ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <FiX className="text-white text-xl" />
              </button>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                <FiImage className="text-white text-xs" />
              </div>
            </div>
          ))}
          {files.length < 5 && (
            <div
              {...getRootProps()}
              className="aspect-square rounded-lg border-2 border-dashed border-dark-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors"
            >
              <input {...getInputProps()} />
              <FiX className="text-gray-500 rotate-45 text-xl" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Step Indicator ─────────────────────────────────────────────────────── */
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                i < current
                  ? 'bg-primary border-primary text-white'
                  : i === current
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-dark-border text-gray-600 bg-dark-muted'
              }`}
            >
              {i < current ? <FiCheck /> : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === current ? 'text-primary font-medium' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 transition-colors ${i < current ? 'bg-primary' : 'bg-dark-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ReturnRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const orderId = searchParams.get('orderId');

  const [step, setStep] = useState(0);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [selectedItems, setSelectedItems] = useState([]);

  // Step 2 state
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  // Step 3 state
  const [refundMethod, setRefundMethod] = useState('original-payment');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!orderId) { navigate('/orders'); return; }

    const load = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.order);
      } catch {
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, isAuthenticated, navigate]);

  const toggleItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const canNext = () => {
    if (step === 0) return selectedItems.length > 0;
    if (step === 1) return reason !== '';
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('orderId', orderId);
      fd.append('reason', reason);
      fd.append('reasonDetail', reasonDetail);
      fd.append('refundMethod', refundMethod);
      selectedItems.forEach((id) => fd.append('items[]', id));
      evidenceFiles.forEach((f) => fd.append('evidence', f));

      await api.post('/returns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Return request submitted successfully!');
      navigate('/profile?tab=orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const returnableItems = order?.items?.filter((item) =>
    ['delivered'].includes(order.status)
  ) || order?.items || [];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <FiArrowLeft /> {step > 0 ? 'Previous Step' : 'Back to Order'}
          </button>
          <h1 className="text-2xl font-brand font-bold text-white">Return Request</h1>
          <p className="text-gray-400 text-sm mt-1">
            Order <span className="text-primary font-mono">#{orderId?.slice(-8).toUpperCase()}</span>
          </p>
        </motion.div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 0: Select Items ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="card space-y-4"
            >
              <h2 className="font-semibold text-white text-lg">Select Items to Return</h2>
              <p className="text-sm text-gray-400">Choose which items you'd like to return from this order.</p>

              {returnableItems.length === 0 ? (
                <div className="text-center py-8">
                  <FiAlertCircle className="text-4xl text-warning mx-auto mb-3" />
                  <p className="text-gray-400">No returnable items found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {returnableItems.map((item) => {
                    const selected = selectedItems.includes(item._id || item.product);
                    return (
                      <button
                        key={item._id || item.product}
                        type="button"
                        onClick={() => toggleItem(item._id || item.product)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selected ? 'border-primary bg-primary/10' : 'border-dark-border hover:border-primary/40'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-primary border-primary' : 'border-dark-border'
                        }`}>
                          {selected && <FiCheck className="text-white text-xs" />}
                        </div>
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark-muted shrink-0">
                          <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-white shrink-0">
                          ৳{item.price?.toLocaleString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedItems.length > 0 && (
                <p className="text-xs text-primary">{selectedItems.length} item(s) selected</p>
              )}
            </motion.div>
          )}

          {/* ── Step 1: Reason & Evidence ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="card space-y-6"
            >
              <div>
                <h2 className="font-semibold text-white text-lg mb-1">Reason for Return</h2>
                <p className="text-sm text-gray-400">Please select a reason that best describes your issue.</p>
              </div>

              <div className="space-y-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left text-sm ${
                      reason === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-dark-border text-gray-300 hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${
                      reason === r.value ? 'border-primary' : 'border-dark-border'
                    }`}>
                      {reason === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    {r.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="input-label">Additional Details</label>
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  rows={4}
                  placeholder="Please describe the issue in detail..."
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="input-label mb-3 block">Evidence Photos <span className="text-gray-500">(optional, max 5)</span></label>
                <EvidenceDropzone files={evidenceFiles} onChange={setEvidenceFiles} />
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Review & Refund ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Refund Method */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-white text-lg">Select Refund Method</h2>
                <div className="space-y-3">
                  {REFUND_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setRefundMethod(m.value)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        refundMethod === m.value ? 'border-primary bg-primary/10' : 'border-dark-border hover:border-primary/40'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{m.icon}</span>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${refundMethod === m.value ? 'text-primary' : 'text-white'}`}>{m.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        refundMethod === m.value ? 'border-primary' : 'border-dark-border'
                      }`}>
                        {refundMethod === m.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Summary */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-white text-lg">Review Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID</span>
                    <span className="font-mono text-primary">#{orderId?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Items to Return</span>
                    <span className="text-white">{selectedItems.length} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reason</span>
                    <span className="text-white">{REASONS.find((r) => r.value === reason)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evidence Photos</span>
                    <span className="text-white">{evidenceFiles.length} photo(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Refund Method</span>
                    <span className="text-white">{REFUND_METHODS.find((m) => m.value === refundMethod)?.label}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex gap-3">
                  <FiAlertCircle className="text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">
                    Our team will review your request within <strong className="text-warning">1-2 business days</strong>.
                    You will be notified via email once a decision is made.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-ghost flex items-center gap-2 flex-1">
              <FiArrowLeft /> Previous
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              Continue <FiChevronRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-accent flex items-center justify-center gap-2 flex-1"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><FiCheck /> Submit Return Request</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

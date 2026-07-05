import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { registerUser, clearError } from '../../features/auth/authSlice';
import { fetchCart } from '../../features/cart/cartSlice';
import toast from 'react-hot-toast';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const firebaseUid = userCredential.user.uid;

      // 2. Register user in our backend DB
      const result = await dispatch(registerUser({ 
        name: form.name, 
        email: form.email, 
        password: form.password,
        firebaseUid 
      }));

      if (registerUser.fulfilled.match(result)) {
        dispatch(fetchCart());
        toast.success('Account created! Welcome to Aesthetic Tech Store 🎉');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Firebase Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden hero-grid px-4 py-10">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <HiSparkles className="text-white text-xl" />
            </div>
            <span className="font-brand font-bold text-xl text-gradient">Aesthetic Tech</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="text-gray-400 mt-1 text-sm">Join and start earning 🪙 MegaCoins</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="John Doe" required className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Min 6 characters" required className="input pl-9 pr-9"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={handleChange} placeholder="Repeat password" required className="input pl-9"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Create Account</span><FiArrowRight /></>
              )}
            </button>
          </form>

          {/* MegaCoin benefit */}
          <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning">🪙 <strong>MegaCoin Bonus!</strong> Earn coins on every purchase and redeem for discounts.</p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-300 font-semibold transition-colors">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

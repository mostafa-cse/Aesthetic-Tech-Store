import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiSearch, FiUser, FiMenu, FiX,
  FiChevronDown, FiLogOut, FiSettings, FiPackage
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { selectCartItemCount } from '../../features/cart/cartSlice';
import { logoutUser } from '../../features/auth/authSlice';
import { toggleCartDrawer } from '../../features/ui/uiSlice';
import toast from 'react-hot-toast';

const categories = [
  { name: 'PC Components', icon: '🖥️', slug: 'pc-components' },
  { name: 'Laptops', icon: '💻', slug: 'laptops' },
  { name: 'Networking', icon: '📡', slug: 'networking' },
  { name: 'Peripherals', icon: '🖱️', slug: 'peripherals' },
  { name: 'Storage', icon: '💾', slug: 'storage' },
  { name: 'Audio', icon: '🎧', slug: 'audio' },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const cartCount = useSelector(selectCartItemCount);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setUserMenuOpen(false);
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-surface/95 backdrop-blur-md border-b border-dark-border shadow-card' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all">
              <HiSparkles className="text-white text-base" />
            </div>
            <span className="font-brand font-bold text-lg hidden sm:block">
              <span className="text-gradient">Aesthetic</span>
              <span className="text-white"> Tech</span>
            </span>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="w-full pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-gray-100 placeholder-gray-500
                           focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            {isAuthenticated && (
              <button
                onClick={() => dispatch(toggleCartDrawer())}
                className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-card transition-colors"
              >
                <FiShoppingCart className="text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-card transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <FiChevronDown className={`text-gray-400 text-sm transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-card py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-dark-border">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        <div className="megacoin-chip mt-1.5 text-xs">
                          🪙 {user?.megaCoinBalance || 0} MegaCoins
                        </div>
                      </div>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-dark-muted transition-colors">
                          <FiSettings className="text-sm" /> Admin Panel
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-muted transition-colors">
                        <FiUser className="text-sm" /> My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark-muted transition-colors">
                        <FiPackage className="text-sm" /> My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-dark-muted transition-colors"
                      >
                        <FiLogOut className="text-sm" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-3 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-card transition-colors"
            >
              {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Categories bar (desktop) */}
        <div className="hidden md:flex items-center gap-1 pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all duration-200 whitespace-nowrap"
            >
              <span>{cat.icon}</span> {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-dark-surface border-t border-dark-border overflow-hidden"
          >
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="input pl-9 text-sm"
                  />
                </div>
              </form>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary py-2 px-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <span>{cat.icon}</span> {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

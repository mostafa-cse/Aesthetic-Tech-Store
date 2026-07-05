import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  FiGrid, FiPackage, FiTag, FiUsers, FiSettings,
  FiShoppingBag, FiMenu, FiX, FiLogOut, FiArrowLeft,
  FiRefreshCw, FiBarChart2
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { logoutUser } from '../features/auth/authSlice';

const navItems = [
  { icon: FiGrid, label: 'Dashboard', to: '/admin' },
  { icon: FiPackage, label: 'Products', to: '/admin/products' },
  { icon: FiShoppingBag, label: 'Orders', to: '/admin/orders' },
  { icon: FiTag, label: 'Coupons', to: '/admin/coupons' },
  { icon: FiRefreshCw, label: 'Returns', to: '/admin/returns' },
  { icon: FiUsers, label: 'Users', to: '/admin/users' },
  { icon: FiBarChart2, label: 'MegaCoin', to: '/admin/megacoin' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-dark">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1A2235', color: '#F9FAFB', border: '1px solid #1F2D45' },
        }}
      />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-dark-surface border-r border-dark-border flex flex-col z-40 overflow-hidden"
          >
            {/* Logo */}
            <div className="flex items-center gap-2 px-5 py-5 border-b border-dark-border">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
                <HiSparkles className="text-white text-lg" />
              </div>
              <div>
                <p className="font-brand font-bold text-sm text-gradient">Aesthetic Tech</p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map(({ icon: Icon, label, to }) => {
                const isActive = to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);
                return (
                  <Link key={to} to={to} className={isActive ? 'nav-item-active' : 'nav-item'}>
                    <Icon className="text-lg shrink-0" />
                    <span className="text-sm">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User + actions */}
            <div className="p-3 border-t border-dark-border space-y-1">
              <Link to="/" className="nav-item text-sm">
                <FiArrowLeft className="text-lg" /> View Store
              </Link>
              <button onClick={handleLogout} className="nav-item w-full text-error hover:text-error hover:bg-error/10">
                <FiLogOut className="text-lg" />
                <span className="text-sm">Logout</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 mt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top bar */}
        <header className="h-14 bg-dark-surface border-b border-dark-border flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-card transition-colors"
          >
            {sidebarOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-white capitalize">
              {navItems.find((n) => location.pathname.startsWith(n.to) && n.to !== '/admin')?.label || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 min-h-[calc(100vh-56px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

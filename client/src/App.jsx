import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchMe } from './features/auth/authSlice';
import { fetchCart } from './features/cart/cartSlice';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Guards
import { ProtectedRoute, AdminRoute, PublicRoute } from './routes/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import HomePage from './pages/user/HomePage';
import ProductsPage from './pages/user/ProductsPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import ReturnRequestPage from './pages/user/ReturnRequestPage';
import MyReturnsPage from './pages/user/MyReturnsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReturns from './pages/admin/AdminReturns';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMegaCoin from './pages/admin/AdminMegaCoin';

// 404
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const dispatch = useDispatch();

  // Initialize auth state and cart on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchMe()).then((result) => {
        if (fetchMe.fulfilled.match(result)) {
          dispatch(fetchCart());
        }
      });
    } else {
      // Still mark as initialized even without token
      dispatch({ type: 'auth/me/rejected' });
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Auth Routes ──────────────────────────────── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── User Routes ─────────────────────────────────────── */}
        <Route element={<UserLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/returns/new" element={<ReturnRequestPage />} />
            <Route path="/returns" element={<MyReturnsPage />} />
          </Route>
        </Route>

        {/* ── Admin Routes ─────────────────────────────────────── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/megacoin" element={<AdminMegaCoin />} />
          </Route>
        </Route>

        {/* ── 404 ──────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Requires authentication
export function ProtectedRoute() {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!initialized) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// Requires admin role
export function AdminRoute() {
  const { user, isAuthenticated, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!initialized) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

// Redirect logged-in users away from auth pages
export function PublicRoute() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/common/CartDrawer';
import { Toaster } from 'react-hot-toast';

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1A2235', color: '#F9FAFB', border: '1px solid #1F2D45' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <CartDrawer />
      <main className="flex-1 pt-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

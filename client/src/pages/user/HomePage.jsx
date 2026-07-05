import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiShield, FiRefreshCw } from 'react-icons/fi';
import { HiSparkles, HiCpuChip } from 'react-icons/hi2';
import ProductCard from '../../components/user/ProductCard';
import api from '../../utils/api';

const categories = [
  { name: 'PC Components', icon: '🖥️', slug: 'pc-components', color: 'from-blue-500/20 to-primary/20', border: 'border-blue-500/30' },
  { name: 'Laptops', icon: '💻', slug: 'laptops', color: 'from-purple-500/20 to-accent/20', border: 'border-purple-500/30' },
  { name: 'Networking', icon: '📡', slug: 'networking', color: 'from-green-500/20 to-accent/20', border: 'border-green-500/30' },
  { name: 'Peripherals', icon: '🖱️', slug: 'peripherals', color: 'from-orange-500/20 to-warning/20', border: 'border-orange-500/30' },
  { name: 'Storage', icon: '💾', slug: 'storage', color: 'from-pink-500/20 to-primary/20', border: 'border-pink-500/30' },
  { name: 'Audio', icon: '🎧', slug: 'audio', color: 'from-yellow-500/20 to-warning/20', border: 'border-yellow-500/30' },
];

const features = [
  { icon: FiZap, title: 'Fast Delivery', desc: '3-5 business days nationwide delivery', color: 'text-warning' },
  { icon: FiShield, title: 'Genuine Products', desc: 'Official warranty on all products', color: 'text-success' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day hassle-free return policy', color: 'text-info' },
  { icon: HiSparkles, title: 'MegaCoin Rewards', desc: 'Earn coins on every purchase', color: 'text-primary' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featRes, latestRes] = await Promise.all([
          api.get('/products?featured=true&limit=4'),
          api.get('/products?limit=8&sort=newest'),
        ]);
        setFeatured(featRes?.data?.products || []);
        setLatest(latestRes?.data?.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center hero-grid overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 badge-accent mb-6 px-4 py-2">
                <HiSparkles className="text-sm" />
                <span className="text-sm">Premium Tech Experience</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-brand font-black leading-tight mb-6">
                <span className="text-white block">Aesthetic</span>
                <span className="text-gradient block">Tech Store</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
                Your premium destination for electronics, PC components, and networking gear. 
                Earn 🪙 <strong className="text-warning">MegaCoins</strong> on every purchase and redeem for exclusive discounts.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                  Shop Now <FiArrowRight />
                </Link>
                <Link to="/products?featured=true" className="btn-outline flex items-center gap-2 px-8 py-3 text-base">
                  View Deals
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-dark-border">
                {[
                  { value: '500+', label: 'Products' },
                  { value: '10K+', label: 'Customers' },
                  { value: '4.9★', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-gradient font-brand">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative w-80 h-80">
                {/* Central chip */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center shadow-glow animate-float">
                    <HiCpuChip className="text-8xl text-primary" />
                  </div>
                </div>
                {/* Orbiting items */}
                {['🖥️', '💻', '🎧', '📡'].map((icon, i) => {
                  const angle = (i * 90 * Math.PI) / 180;
                  const r = 140;
                  const x = Math.cos(angle) * r;
                  const y = Math.sin(angle) * r;
                  return (
                    <div
                      key={i}
                      style={{ transform: `translate(calc(50% + ${x}px - 24px), calc(50% + ${y}px - 24px))` }}
                      className="absolute w-12 h-12 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-2xl shadow-card animate-float"
                      style={{ animationDelay: `${i * 0.5}s`, position: 'absolute', left: `calc(50% + ${x}px - 24px)`, top: `calc(50% + ${y}px - 24px)` }}
                    >
                      {icon}
                    </div>
                  );
                })}
                {/* Ring */}
                <div className="absolute inset-0 rounded-full border border-primary/10" />
                <div className="absolute inset-4 rounded-full border border-accent/10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Bar ────────────────────────────────────────────────── */}
      <section className="py-8 border-y border-dark-border bg-dark-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center ${f.color} shrink-0`}>
                  <f.icon className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="text-gray-400 mt-1 text-sm">Find exactly what you're looking for</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.slug} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
              <Link
                to={`/products?category=${cat.slug}`}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br ${cat.color} border ${cat.border} hover:scale-105 hover:shadow-glow-sm transition-all duration-300 text-center group`}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-white">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ───────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-16 bg-dark-surface/30 border-y border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-1">Editor's Pick</p>
                <h2 className="section-title">Featured Products</h2>
              </div>
              <Link to="/products?featured=true" className="flex items-center gap-1 text-sm text-primary hover:text-primary-300 transition-colors">
                View All <FiArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MegaCoin Banner ─────────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-warning/20 via-dark-card to-primary/20 border border-warning/30 p-8 md:p-12"
        >
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-warning/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-6xl mb-4">🪙</div>
              <h2 className="text-3xl font-brand font-bold text-white mb-2">Earn MegaCoins</h2>
              <p className="text-gray-300 max-w-md">
                Every purchase earns you MegaCoins. Collect them and redeem for exclusive discounts on your next order. 
                <strong className="text-warning"> ৳10 = 1 MegaCoin · 10 Coins = ৳1 off!</strong>
              </p>
            </div>
            <Link to="/register" className="btn-accent shrink-0 flex items-center gap-2 px-8 py-3 text-base whitespace-nowrap">
              Start Earning <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Latest Products ─────────────────────────────────────────────── */}
      <section className="py-16 bg-dark-surface/20 border-t border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-accent uppercase tracking-widest font-semibold mb-1">Just Arrived</p>
              <h2 className="section-title">Latest Products</h2>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-sm text-primary hover:text-primary-300 transition-colors">
              Browse All <FiArrowRight className="text-xs" />
            </Link>
          </div>
          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-2/3 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-6 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {latest.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

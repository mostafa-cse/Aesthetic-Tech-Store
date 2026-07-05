import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiGrid, FiArrowRight } from 'react-icons/fi';

/* ─── Floating Particle ───────────────────────────────────────────────────── */
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{
        y: [0, -30, 0],
        x: [0, Math.random() * 20 - 10, 0],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3 + Math.random() * 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: Math.random() * 3,
      }}
    />
  );
}

function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 4 + 2}px`,
      height: `${Math.random() * 4 + 2}px`,
      background: i % 3 === 0
        ? 'rgba(108, 99, 255, 0.6)'
        : i % 3 === 1
        ? 'rgba(0, 212, 170, 0.5)'
        : 'rgba(255, 255, 255, 0.3)',
    },
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <Particle key={p.id} style={p.style} />
      ))}
    </div>
  );
}

/* ─── Glitch Text ─────────────────────────────────────────────────────────── */
function GlitchText() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative select-none">
      {/* Main text */}
      <h1
        className="text-[clamp(6rem,20vw,14rem)] font-black font-brand leading-none"
        style={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #00D4AA 50%, #6C63FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '200% 200%',
          filter: glitch ? 'blur(1px)' : 'none',
          transition: 'filter 0.05s',
        }}
      >
        404
      </h1>

      {/* Glitch layer 1 */}
      {glitch && (
        <>
          <h1
            aria-hidden
            className="absolute inset-0 text-[clamp(6rem,20vw,14rem)] font-black font-brand leading-none"
            style={{
              color: '#ff0040',
              clipPath: 'polygon(0 30%, 100% 30%, 100% 50%, 0 50%)',
              transform: 'translateX(-4px)',
              opacity: 0.7,
              WebkitTextFillColor: '#ff0040',
            }}
          >
            404
          </h1>
          <h1
            aria-hidden
            className="absolute inset-0 text-[clamp(6rem,20vw,14rem)] font-black font-brand leading-none"
            style={{
              color: '#00D4AA',
              clipPath: 'polygon(0 60%, 100% 60%, 100% 75%, 0 75%)',
              transform: 'translateX(4px)',
              opacity: 0.7,
              WebkitTextFillColor: '#00D4AA',
            }}
          >
            404
          </h1>
        </>
      )}
    </div>
  );
}

/* ─── Scan Line Effect ────────────────────────────────────────────────────── */
function ScanLine() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      aria-hidden
    >
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(108, 99, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 99, 255, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Floating Particles */}
      <ParticleField />

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Terminal-style container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative inline-block mb-2"
        >
          {/* Top bar */}
          <div className="flex items-center gap-1.5 mb-3 justify-start">
            <div className="w-3 h-3 rounded-full bg-error/70" />
            <div className="w-3 h-3 rounded-full bg-warning/70" />
            <div className="w-3 h-3 rounded-full bg-success/70" />
            <span className="ml-2 text-xs text-gray-600 font-mono">error_handler.exe</span>
          </div>

          <GlitchText />
        </motion.div>

        {/* Error message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 mb-8"
        >
          {/* Blink cursor effect */}
          <div className="font-mono text-sm text-accent flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-500">&gt;</span>
            <span>ERROR_CODE: PAGE_NOT_FOUND</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-accent"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Oops! Lost in the Matrix
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved to another dimension.
          </p>

          {/* Status code details */}
          <div className="inline-flex items-center gap-4 mt-2 px-5 py-3 rounded-xl bg-dark-card border border-dark-border font-mono text-xs text-gray-500">
            <span className="text-error">404</span>
            <span className="text-dark-border">|</span>
            <span>Not Found</span>
            <span className="text-dark-border">|</span>
            <span className="text-gray-600">{new Date().toISOString().split('T')[0]}</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="btn-primary flex items-center gap-2 px-8 py-3 text-base w-full sm:w-auto justify-center"
          >
            <FiHome className="text-sm" />
            Go Home
          </Link>
          <Link
            to="/products"
            className="btn-outline flex items-center gap-2 px-8 py-3 text-base w-full sm:w-auto justify-center"
          >
            <FiGrid className="text-sm" />
            Browse Products
            <FiArrowRight className="text-sm" />
          </Link>
        </motion.div>

        {/* Fun tech suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-xs text-gray-600">You might be looking for:</span>
          {[
            { to: '/products', label: 'All Products' },
            { to: '/products?category=laptops', label: 'Laptops' },
            { to: '/products?category=pc-components', label: 'PC Parts' },
            { to: '/profile', label: 'My Profile' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-primary hover:border-primary/40 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

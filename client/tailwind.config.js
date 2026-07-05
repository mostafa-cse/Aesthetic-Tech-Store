/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50: '#F0EFFF',
          100: '#E0DEFF',
          200: '#C2BCFF',
          300: '#A39AFF',
          400: '#8578FF',
          500: '#6C63FF',
          600: '#4D42E8',
          700: '#3730C4',
          800: '#2420A0',
          900: '#14127D',
        },
        accent: {
          DEFAULT: '#00D4AA',
          dark: '#00A887',
        },
        dark: {
          DEFAULT: '#0A0E1A',
          surface: '#111827',
          card: '#1A2235',
          border: '#1F2D45',
          muted: '#243047',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        brand: ['Orbitron', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #0A0E1A 0%, #111827 50%, #0A0E1A 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(0, 212, 170, 0.05))',
        'glow-primary': 'radial-gradient(circle at center, rgba(108, 99, 255, 0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(108, 99, 255, 0.3)',
        'glow': '0 0 20px rgba(108, 99, 255, 0.4)',
        'glow-lg': '0 0 40px rgba(108, 99, 255, 0.5)',
        'glow-accent': '0 0 20px rgba(0, 212, 170, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(108, 99, 255, 0.3)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(108, 99, 255, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(108, 99, 255, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

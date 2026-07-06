import { Link } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi2';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-dark-surface border-t border-dark-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
                <HiSparkles className="text-white text-lg" />
              </div>
              <span className="font-brand font-bold text-xl">
                <span className="text-gradient">Aesthetic</span>
                <span className="text-white"> Tech</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your premium destination for electronics, PC components, and networking gear. Quality meets aesthetics.
            </p>
            <div className="flex items-center gap-3">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-primary hover:border-primary/50 transition-all duration-200">
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Products', to: '/products' },
                { label: 'PC Components', to: '/products?category=pc-components' },
                { label: 'Laptops', to: '/products?category=laptops' },
                { label: 'Networking', to: '/products?category=networking' },
                { label: 'Deals & Offers', to: '/products?featured=true' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-white font-semibold mb-4">Policies</h3>
            <ul className="space-y-2.5">
              {[
                'Return Policy',
                'Warranty Policy',
                'Shipping Policy',
                'Privacy Policy',
                'Terms & Conditions',
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <FiMapPin className="text-primary mt-0.5 shrink-0" />
                <span>Jashore University Of Science and Technology</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <FiPhone className="text-primary shrink-0" />
                <span>01571276031</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <FiMail className="text-primary shrink-0" />
                <span>support@aesthetictech.com</span>
              </li>
            </ul>
            {/* MegaCoin promo */}
            <div className="mt-5 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning font-semibold">🪙 MegaCoin Loyalty</p>
              <p className="text-xs text-gray-400 mt-1">Earn coins on every purchase. Redeem for discounts!</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-dark-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">© 2024 Aesthetic Tech Store. BUS 4101 | CSE-21 Project.</p>
          <div className="flex items-center gap-2">
            {['visa', 'mastercard', 'bkash'].map((method) => (
              <span key={method} className="text-xs bg-dark-card border border-dark-border px-2 py-1 rounded text-gray-400 uppercase">{method}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

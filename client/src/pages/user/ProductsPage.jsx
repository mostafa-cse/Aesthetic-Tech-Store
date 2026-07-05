import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSliders, FiX, FiChevronDown, FiSearch,
  FiChevronLeft, FiChevronRight, FiStar
} from 'react-icons/fi';
import ProductCard from '../../components/user/ProductCard';
import api from '../../utils/api';

const CATEGORIES = [
  { label: 'PC Components', value: 'pc-components' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Networking', value: 'networking' },
  { label: 'Peripherals', value: 'peripherals' },
  { label: 'Storage', value: 'storage' },
  { label: 'Audio', value: 'audio' },
];

const BRANDS = [
  'ASUS', 'MSI', 'Gigabyte', 'Intel', 'AMD', 'NVIDIA',
  'Samsung', 'WD', 'Seagate', 'Corsair', 'Kingston', 'Logitech',
  'Razer', 'SteelSeries', 'TP-Link', 'Netgear',
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Most Popular', value: 'popular' },
];

const RATINGS = [4, 3, 2, 1];

function SkeletonCard() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-6 w-1/2 rounded mt-3" />
      </div>
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-dark-border pb-4 mb-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <FiChevronDown className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword   = searchParams.get('keyword') || '';
  const category  = searchParams.get('category') || '';
  const brand     = searchParams.get('brand') || '';
  const minPrice  = Number(searchParams.get('minPrice') || 0);
  const maxPrice  = Number(searchParams.get('maxPrice') || 200000);
  const sort      = searchParams.get('sort') || 'newest';
  const page      = Number(searchParams.get('page') || 1);
  const rating    = Number(searchParams.get('rating') || 0);

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [keywordInput, setKeywordInput] = useState(keyword);

  const selectedCategories = category ? category.split(',').filter(Boolean) : [];
  const selectedBrands     = brand ? brand.split(',').filter(Boolean) : [];

  const updateParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value !== '' && value != null) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  }, [setSearchParams]);

  const toggleFilter = (key, value, current) => {
    const arr = current ? current.split(',').filter(Boolean) : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    updateParam(key, arr.join(','));
  };

  const applyPriceRange = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('minPrice', priceRange[0]);
      next.set('maxPrice', priceRange[1]);
      next.set('page', '1');
      return next;
    });
  };

  // Active filter chips
  const activeFilters = [];
  if (keyword) activeFilters.push({ label: `"${keyword}"`, key: 'keyword', value: null });
  selectedCategories.forEach(c => {
    const cat = CATEGORIES.find(x => x.value === c);
    activeFilters.push({ label: cat?.label || c, key: 'category', value: c });
  });
  selectedBrands.forEach(b => activeFilters.push({ label: b, key: 'brand', value: b }));
  if (minPrice > 0) activeFilters.push({ label: `Min ৳${minPrice.toLocaleString()}`, key: 'minPrice', value: null });
  if (maxPrice < 200000) activeFilters.push({ label: `Max ৳${maxPrice.toLocaleString()}`, key: 'maxPrice', value: null });
  if (rating) activeFilters.push({ label: `${rating}★ & up`, key: 'rating', value: null });

  const removeActiveFilter = (f) => {
    if (f.key === 'category') toggleFilter('category', f.value, category);
    else if (f.key === 'brand') toggleFilter('brand', f.value, brand);
    else updateParam(f.key, '');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword)        params.set('keyword', keyword);
        if (category)       params.set('category', category);
        if (brand)          params.set('brand', brand);
        if (minPrice > 0)   params.set('minPrice', minPrice);
        if (maxPrice < 200000) params.set('maxPrice', maxPrice);
        if (sort)           params.set('sort', sort);
        if (page > 1)       params.set('page', page);
        if (rating > 0)     params.set('rating', rating);
        params.set('limit', '12');
        const res = await api.get(`/products?${params}`);
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalProducts(res.data.total || 0);
      } catch (err) {
        console.error('Products fetch error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [keyword, category, brand, minPrice, maxPrice, sort, page, rating]);

  const FilterPanel = () => (
    <div>
      <FilterSection title="Search">
        <form onSubmit={(e) => { e.preventDefault(); updateParam('keyword', keywordInput); }}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="Search products..."
              className="input pl-9 text-sm"
            />
          </div>
        </form>
      </FilterSection>

      <FilterSection title="Category">
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.value)}
                onChange={() => toggleFilter('category', cat.value, category)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand" defaultOpen={false}>
        <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-hide pr-1">
          {BRANDS.map(b => (
            <label key={b} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b)}
                onChange={() => toggleFilter('brand', b, brand)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{b}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>৳{priceRange[0].toLocaleString()}</span>
            <span>৳{priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range" min={0} max={200000} step={1000}
            value={priceRange[0]}
            onChange={e => setPriceRange([Math.min(+e.target.value, priceRange[1] - 1000), priceRange[1]])}
            className="w-full accent-primary cursor-pointer"
          />
          <input
            type="range" min={0} max={200000} step={1000}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Math.max(+e.target.value, priceRange[0] + 1000)])}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} placeholder="Min" className="input text-xs py-1.5" />
            <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} placeholder="Max" className="input text-xs py-1.5" />
          </div>
          <button onClick={applyPriceRange} className="btn-outline w-full text-xs py-2">Apply Price</button>
        </div>
      </FilterSection>

      <FilterSection title="Min Rating" defaultOpen={false}>
        <div className="space-y-1.5">
          {RATINGS.map(r => (
            <button
              key={r}
              onClick={() => updateParam('rating', rating === r ? '' : r)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                rating === r
                  ? 'bg-primary/20 border border-primary/40 text-primary-300'
                  : 'hover:bg-dark-muted text-gray-400'
              }`}
            >
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <FiStar key={s} className={`text-xs ${s <= r ? 'text-warning' : 'text-gray-600'}`} />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {activeFilters.length > 0 && (
        <button onClick={() => setSearchParams({})} className="w-full text-xs text-error hover:text-red-400 py-2 transition-colors mt-1">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-brand font-bold text-white">
              {keyword ? `Results for "${keyword}"` : 'All Products'}
            </h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">{totalProducts.toLocaleString()} products found</p>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 btn-outline text-sm py-2 px-3"
          >
            <FiSliders />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Active chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilters.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/15 border border-primary/30 text-primary-300 px-3 py-1 rounded-full">
                {f.label}
                <button onClick={() => removeActiveFilter(f)} className="hover:text-white ml-0.5">
                  <FiX className="text-[10px]" />
                </button>
              </span>
            ))}
            <button onClick={() => setSearchParams({})} className="text-xs text-gray-500 hover:text-error transition-colors px-2">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="card sticky top-24 p-5">
              <h2 className="text-sm font-bold text-white mb-4 pb-3 border-b border-dark-border flex items-center gap-2">
                <FiSliders className="text-primary" /> Filters
              </h2>
              <FilterPanel />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500 hidden sm:block">
                {loading ? 'Loading…' : `Showing ${products.length} of ${totalProducts}`}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500 whitespace-nowrap">Sort by:</span>
                <select
                  value={sort}
                  onChange={e => updateParam('sort', e.target.value)}
                  className="bg-dark-card border border-dark-border text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="text-7xl mb-5">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">Try adjusting your filters or search terms to find what you're looking for</p>
                <button onClick={() => setSearchParams({})} className="btn-primary">Clear Filters</button>
              </motion.div>
            ) : (
              <motion.div
                key={`${keyword}-${category}-${brand}-${sort}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {products.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => updateParam('page', Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-primary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const near = Math.abs(p - page) <= 2;
                  const isEdge = p === 1 || p === totalPages;
                  if (!near && !isEdge) {
                    if (Math.abs(p - page) === 3) return <span key={p} className="text-gray-600 px-1">…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        p === page
                          ? 'bg-primary text-white shadow-glow-sm'
                          : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-primary/60'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateParam('page', Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-primary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-dark-surface border-r border-dark-border z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <FiSliders className="text-primary" /> Filters
                </h2>
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-muted">
                  <FiX />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterPanel />
              </div>
              <div className="p-4 border-t border-dark-border">
                <button onClick={() => setDrawerOpen(false)} className="btn-primary w-full">
                  Show {totalProducts.toLocaleString()} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { PRODUCTS } from '../data/products';
import type { Product } from '../data/products';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductIllustration } from '../components/ProductIllustration';
import {
  FiShoppingCart, FiCheck, FiArrowRight,
  FiMinus, FiPlus, FiStar, FiPackage, FiShield, FiDroplet
} from 'react-icons/fi';

function Image3D({ id, color, src }: { id: string; color: string; src?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [22, -22]), { stiffness: 160, damping: 24 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-22, 22]), { stiffness: 160, damping: 24 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const onMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="flex items-center justify-center select-none" style={{ perspective: '900px' }}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-96 lg:h-96"
      >
        <div style={{ filter: `drop-shadow(0 40px 80px ${color}aa) drop-shadow(0 10px 30px ${color}66)` }}
          className="w-full h-full">
          {src
            ? <img src={src} alt={id} className="w-full h-full object-contain" />
            : <ProductIllustration id={id} color={color} />
          }
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-6 rounded-full blur-2xl opacity-50"
          style={{ backgroundColor: color }} />
      </motion.div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart, items } = useCart();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [product, setProduct] = useState<Product | null>(
    PRODUCTS.find((p) => p.id === id) ?? null
  );

  useEffect(() => {
    if (!id) return;
    productsAPI.getOne(id).then((res) => {
      const p = (res.data as { product?: Product })?.product;
      if (p) setProduct(p);
    }).catch(() => {});
  }, [id]);

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">المنتج غير موجود</p>
        <Link to="/products" className="btn-primary">العودة للمنتجات</Link>
      </div>
    </div>
  );

  const cartQty = items.find((i) => i.id === product.id)?.quantity ?? 0;

  const handleAdd = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return;
    }
    addItem({
      id: product.id, name: product.name, nameAr: product.nameAr,
      price: product.price, count: product.count, color: product.color,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 pb-10" style={{ background: `linear-gradient(to bottom, #060008 0%, ${product.bg[0]} 45%, ${product.color}55 100%)` }}>

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full blur-[150px] opacity-15" style={{ backgroundColor: product.color }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full blur-[150px] opacity-10" style={{ backgroundColor: product.color }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-8">

        {/* Back */}
        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors text-sm">
          <FiArrowRight size={16} />
          العودة
        </motion.button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Image */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Image3D id={product.id} color={product.color} src={product.image} />
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }} className="space-y-5">

            {/* Badge + name */}
            <div>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white mb-3"
                style={{ backgroundColor: product.color }}>
                {product.badge}
              </span>
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">allsence</div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">{product.name}</h1>
              <div className="text-xl font-bold mt-1" style={{ color: product.color }}>{product.nameAr}</div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} size={14} className="fill-current" style={{ color: product.color }} />
              ))}
              <span className="text-xs text-gray-400 mr-2">4.9 (128 تقييم)</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-white">₪{product.price}</span>
              <span className="text-gray-400 text-sm mb-1">{product.count} قطعة في العبوة</span>
            </div>

            {/* Features quick list */}
            <div className="grid grid-cols-2 gap-2">
              {product.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${product.color}30` }}>
                    <FiCheck size={10} style={{ color: product.color }} />
                  </span>
                  {f}
                </div>
              ))}
            </div>

            {/* Qty + Add to cart */}
            <div className="flex items-center gap-4 pt-2">
              {/* Qty selector */}
              <div className="flex items-center gap-2 glass-card rounded-xl px-2 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <FiMinus size={14} />
                </button>
                <span className="text-white font-bold w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <FiPlus size={14} />
                </button>
              </div>

              {/* Add to cart */}
              <motion.button
                whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white text-base transition-all"
                style={{ backgroundColor: product.color, boxShadow: `0 8px 30px ${product.color}55` }}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span key="added" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <FiCheck size={16} /> أضيف للسلة!
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <FiShoppingCart size={16} /> أضف للسلة
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Go to cart if already in cart */}
              {isInCart(product.id) && (
                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                  <Link to="/cart"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-3 rounded-2xl glass-card hover:bg-white/10 transition-all whitespace-nowrap"
                    style={{ color: product.color }}>
                    <FiShoppingCart size={13} />
                    السلة ({cartQty})
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Trust icons */}
            <div className="flex gap-4 pt-1">
              {[
                { icon: FiShield, label: 'ضمان الجودة' },
                { icon: FiPackage, label: 'شحن سريع' },
                { icon: FiDroplet, label: '100% طبيعي' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <t.icon size={12} style={{ color: product.color }} />
                  {t.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs: description + specs */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="mt-16">

          <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
            {[{ key: 'desc', label: 'الوصف' }, { key: 'specs', label: 'المواصفات' }].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key as 'desc' | 'specs')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                  activeTab === t.key
                    ? 'text-white border-current'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
                style={activeTab === t.key ? { borderColor: product.color, color: product.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'desc' ? (
              <motion.p key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-gray-300 leading-loose text-base max-w-2xl">
                {product.longDesc}
              </motion.p>
            ) : (
              <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                {product.specs.map((s) => (
                  <div key={s.label} className="glass-card rounded-2xl p-4">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-white font-semibold">{s.value}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Related Products */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="mt-16">
          <h2 className="text-xl font-black text-white mb-6">منتجات أخرى</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PRODUCTS.filter((p) => p.id !== product.id).map((p) => (
              <Link key={p.id} to={`/product/${p.id}`}
                className="flex-shrink-0 glass-card rounded-2xl p-4 w-44 hover:border-white/20 transition-all group">
                <div className="w-full h-24 mb-3 flex items-center justify-center">
                  <div style={{ filter: `drop-shadow(0 8px 20px ${p.color}88)` }} className="w-20 h-20">
                    <ProductIllustration id={p.id} color={p.color} />
                  </div>
                </div>
                <div className="text-xs text-gray-400">{p.name}</div>
                <div className="text-sm font-bold text-white mt-0.5">{p.nameAr}</div>
                <div className="text-sm font-black mt-1" style={{ color: p.color }}>₪{p.price}</div>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

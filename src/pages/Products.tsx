import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product } from '../data/products';
import { productsAPI, adminAPI } from '../services/api';
import { ProductIllustration } from '../components/ProductIllustration';
import {
  FiShoppingCart, FiChevronUp, FiChevronDown,
  FiCamera, FiUpload, FiArrowLeft, FiCheck,
} from 'react-icons/fi';

type DisplayProduct = Product & { defaultImg: string | null };

// ── 3D Image Component ───────────────────────────────────────────────────────
function Image3D({
  src, color, name, id, onEdit, canEdit,
}: {
  src: string | null; color: string; name: string; id: string; onEdit?: () => void; canEdit?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [20, -20]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-20, 20]), { stiffness: 180, damping: 28 });
  const z = useSpring(useTransform(mouseX, [-200, 200], [0, 10]), { stiffness: 180, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center select-none"
      style={{ perspective: '900px' }}
    >
      <motion.div
        style={{ rotateX, rotateY, z, transformStyle: 'preserve-3d' }}
        className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* NO border card — just the illustration / image floating */}
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-contain"
            style={{
              filter: `drop-shadow(0 30px 60px ${color}99) drop-shadow(0 10px 30px ${color}66)`,
            }}
          />
        ) : (
          <div className="w-full h-full" style={{ filter: `drop-shadow(0 30px 60px ${color}99)` }}>
            <ProductIllustration id={id} color={color} />
          </div>
        )}

        {/* Edit button — admin only */}
        {canEdit && (
          <button
            onClick={onEdit}
            className="absolute -top-4 -left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: color, boxShadow: `0 4px 20px ${color}88` }}
            title="تغيير الصورة"
          >
            <FiCamera size={15} />
          </button>
        )}
      </motion.div>

      {/* Floating shadow */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-6 rounded-full blur-2xl opacity-40"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Products() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [products, setProducts] = useState<DisplayProduct[]>([]);

  useEffect(() => {
    productsAPI.getAll().then((res) => {
      const list: Product[] = (res.data as { products?: Product[] })?.products || [];
      setProducts(list.map((p) => ({ ...p, defaultImg: p.image || null })));
    }).catch(() => {});
  }, []);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingId = useRef<string | null>(null);

  const total = products.length;

  // ── Scroll / wheel handler ────────────────────────────────────────────────
  const goTo = useCallback((dir: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    setDirection(dir);
    setCurrent((c) => (c + dir + total) % total);
    setTimeout(() => setBusy(false), 700);
  }, [busy, total]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 30) goTo(1);
      else if (e.deltaY < -30) goTo(-1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [goTo]);

  // Touch swipe
  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? 1 : -1);
  };

  // ── Admin image upload ────────────────────────────────────────────────────
  const openImagePicker = (productId: string) => {
    editingId.current = productId;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const id = editingId.current!;
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, defaultImg: src } : p));
      adminAPI.updateProduct(id, { image: src }).catch(() => {});
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const p = products[current];

  if (!p) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0d001a' }}>
        <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Animation variants ────────────────────────────────────────────────────
  const variants = {
    enter: (d: number) => ({ opacity: 0, y: d > 0 ? 80 : -80, scale: 0.92, rotateX: d > 0 ? -12 : 12 }),
    center: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
    exit: (d: number) => ({ opacity: 0, y: d > 0 ? -80 : 80, scale: 0.92, rotateX: d > 0 ? 12 : -12 }),
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: `linear-gradient(to bottom, #060008 0%, ${p.bg[0]} 45%, ${p.color}55 100%)` }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Hidden file input for admin */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Animated bg blobs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
            style={{ backgroundColor: p.color }} />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] opacity-10"
            style={{ backgroundColor: p.color }} />
        </motion.div>
      </AnimatePresence>

      {/* Top navbar spacing */}
      <div className="absolute inset-0 pt-16 flex flex-col">

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl mx-auto"
            >
              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

                {/* 3D Image */}
                <div className="flex-1 flex justify-center">
                  <Image3D
                    src={p.defaultImg}
                    color={p.color}
                    name={p.name}
                    id={p.id}
                    canEdit={isAdmin}
                    onEdit={() => openImagePicker(p.id)}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-right max-w-md w-full">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white mb-4"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.badge}
                  </motion.div>

                  {/* Name */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">allsence</div>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">{p.name}</h1>
                    <div className="text-xl font-bold mt-1" style={{ color: p.color }}>{p.nameAr}</div>
                  </motion.div>

                  {/* Desc */}
                  <motion.p
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                    className="text-gray-300 mt-4 leading-relaxed text-sm md:text-base"
                  >
                    {p.desc}
                  </motion.p>

                  {/* Features */}
                  <motion.ul
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className="mt-5 space-y-2"
                  >
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-200">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${p.color}33` }}>
                          <FiCheck size={11} style={{ color: p.color }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </motion.ul>

                  {/* Price + CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="mt-7 space-y-3"
                  >
                    <div>
                      <div className="text-3xl font-black text-white">₪{p.price}</div>
                      <div className="text-xs text-gray-400">{p.count} قطعة في العبوة</div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {/* Add to cart */}
                      <button
                        onClick={() => {
                          if (!user) { navigate('/login', { state: { from: '/products' } }); return; }
                          addItem({ id: p.id, name: p.name, nameAr: p.nameAr, price: p.price, count: p.count, color: p.color });
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: p.color, boxShadow: `0 8px 30px ${p.color}55` }}
                      >
                        <FiShoppingCart size={15} />
                        أضف للسلة
                      </button>
                      {/* View details */}
                      <Link
                        to={`/product/${p.id}`}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm glass-card hover:bg-white/10 transition-all"
                        style={{ color: p.color }}
                      >
                        التفاصيل
                        <FiArrowLeft size={14} />
                      </Link>
                    </div>
                  </motion.div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom: progress + navigation ──────────────────────────────── */}
        <div className="pb-6 px-6 flex items-center justify-between">

          {/* Dot indicators */}
          <div className="flex gap-2">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (!busy) { setDirection(i > current ? 1 : -1); setCurrent(i); setBusy(true); setTimeout(() => setBusy(false), 700); } }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8,
                  height: 8,
                  backgroundColor: i === current ? p.color : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* Product name + counter */}
          <div className="text-center">
            <div className="text-xs text-gray-500">{current + 1} / {total}</div>
          </div>

          {/* Arrow navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => goTo(-1)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
            >
              <FiChevronUp size={18} />
            </button>
            <button
              onClick={() => goTo(1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
              style={{ backgroundColor: p.color }}
            >
              <FiChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* Scroll hint (first visit) */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-gray-500 text-center pointer-events-none"
        >
          <div>سكرولي للتنقل بين المنتجات</div>
          <div className="flex justify-center mt-1 gap-1">
            <FiChevronDown className="animate-bounce" />
          </div>
        </motion.div>

        {/* Admin upload hint */}
        {isAdmin && !p.defaultImg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-4 py-2 rounded-full text-xs text-gray-300"
          >
            <FiUpload size={12} className="text-pink-400" />
            اضغط على أيقونة الكاميرا لإضافة صورة المنتج
          </motion.div>
        )}
      </div>

    </div>
  );
}

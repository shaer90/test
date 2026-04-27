import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ProductIllustration } from '../components/ProductIllustration';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

export default function Cart() {
  const { items, totalItems, totalPrice, removeItem, updateQty, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="light-page min-h-screen pt-24 flex flex-col items-center justify-center px-4 text-center" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-24 h-24 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-6">
          <FiShoppingBag size={36} className="text-pink-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">السلة فارغة</h2>
        <p className="text-gray-400 mb-8">لم تضيفي أي منتج بعد</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          <FiArrowRight size={16} />
          تصفح المنتجات
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white">سلة التسوق</h1>
              <p className="text-gray-400 mt-1">{totalItems} منتج</p>
            </div>
            <button onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5">
              <FiTrash2 size={13} />
              مسح السلة
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  style={{ borderColor: `${item.color}30` }}
                >
                  {/* Thumbnail */}
                  <Link to={`/product/${item.id}`}
                    className="w-20 h-20 flex-shrink-0 flex items-center justify-center"
                    style={{ filter: `drop-shadow(0 6px 16px ${item.color}66)` }}>
                    <ProductIllustration id={item.id} color={item.color} />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.id}`}>
                      <div className="font-bold text-white text-sm">{item.nameAr}</div>
                      <div className="text-xs text-gray-400">{item.name}</div>
                    </Link>
                    <div className="text-sm font-black mt-1" style={{ color: item.color }}>
                      ₪{item.price}
                    </div>
                  </div>

                  {/* Qty */}
                  <div className="flex items-center gap-2 glass-card rounded-xl px-1.5 py-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                      <FiMinus size={12} />
                    </button>
                    <span className="text-white font-bold text-sm w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                      <FiPlus size={12} />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right flex-shrink-0 w-16">
                    <div className="font-black text-white text-sm">₪{(item.price * item.quantity).toFixed(2)}</div>
                    <button onClick={() => removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors mt-1">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Continue shopping */}
            <Link to="/products"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors mt-2">
              <FiArrowRight size={14} />
              متابعة التسوق
            </Link>
          </div>

          {/* Order summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card rounded-3xl p-6 sticky top-20 border border-pink-500/20">
              <h2 className="text-lg font-black text-white mb-5">ملخص الطلب</h2>

              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-gray-300">
                    <span>{item.nameAr} ×{item.quantity}</span>
                    <span>₪{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between text-gray-300">
                  <span>الشحن</span>
                  <span className="text-green-400 font-semibold">مجاني</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-bold text-base">الإجمالي</span>
                  <span className="text-2xl font-black text-pink-400">₪{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout"
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3.5 text-base">
                <FiArrowLeft size={16} />
                إتمام الطلب
              </Link>

              {/* Trust */}
              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 دفع آمن ومحمي بالكامل
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

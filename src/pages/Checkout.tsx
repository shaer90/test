import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import {
  FiCheck, FiArrowRight, FiMapPin, FiPhone,
  FiUser, FiShoppingBag, FiTruck, FiLock
} from 'react-icons/fi';

type Step = 1 | 2 | 3;

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();

  const availableCommission = user?.availableCommission || 0;
  const PAYMENT_METHODS = [
    { id: 'cash', label: 'الدفع عند الاستلام', icon: '💵', desc: 'ادفعي نقداً عند وصول طلبك', disabled: false },
    {
      id: 'commission',
      label: 'من الرصيد المتاح',
      icon: '💰',
      desc: availableCommission >= totalPrice
        ? `رصيدك: ₪${availableCommission.toFixed(2)} — كافٍ ✓`
        : `رصيدك: ₪${availableCommission.toFixed(2)} — غير كافٍ`,
      disabled: availableCommission < totalPrice,
    },
  ];


  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
    street: '',
    notes: '',
    paymentMethod: 'cash',
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!form.fullName.trim()) { setError('يرجى إدخال الاسم الكامل'); return false; }
    if (!form.phone.trim()) { setError('يرجى إدخال رقم الهاتف'); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!form.city.trim()) { setError('يرجى إدخال المدينة'); return false; }
    if (!form.street.trim()) { setError('يرجى إدخال الشارع'); return false; }
    if (form.paymentMethod === 'commission' && availableCommission < totalPrice) {
      setError(`الرصيد غير كافٍ. رصيدك المتاح ₪${availableCommission.toFixed(2)} وقيمة الطلب ₪${totalPrice.toFixed(2)}`);
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s + 1) as Step);
  };

  const placeOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const address = `${form.country}، ${form.city}، ${form.street}`;
      const res = await ordersAPI.create({
        items: items.map((i) => ({ id: i.id, name: i.name, nameAr: i.nameAr, price: i.price, quantity: i.quantity, color: i.color })),
        totalPrice,
        address,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
        fullName: form.fullName,
        phone: form.phone,
      });
      setOrderId((res.data as { order: { _id: string } }).order._id);
      clearCart();
      setStep(3);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Empty cart (but not on success step)
  if (items.length === 0 && step !== 3) return (
    <div className="light-page min-h-screen pt-24 flex flex-col items-center justify-center px-4 text-center" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <FiShoppingBag size={40} className="text-gray-600 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">السلة فارغة</h2>
      <Link to="/products" className="btn-primary mt-4">تسوقي الآن</Link>
    </div>
  );

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-4 mb-8">
          <h1 className="text-3xl font-black text-white">إتمام الطلب</h1>

          {/* Steps indicator */}
          {step < 3 && (
            <div className="flex items-center gap-3 mt-5">
              {[
                { n: 1, label: 'بياناتك' },
                { n: 2, label: 'العنوان' },
                { n: 3, label: 'تأكيد' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 ${step >= s.n ? 'text-white' : 'text-gray-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.n ? 'bg-green-500' : step === s.n ? 'bg-pink-600' : 'bg-white/10'
                    }`}>
                      {step > s.n ? <FiCheck size={14} /> : s.n}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 w-8 sm:w-14 transition-all ${step > s.n ? 'bg-green-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main form area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Personal info ─────────────────────────────── */}
              {step === 1 && (
                <motion.div key="s1" variants={stepVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35 }}
                  className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <FiUser className="text-pink-400" size={18} />
                    <h2 className="text-lg font-bold text-white">معلوماتك الشخصية</h2>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">الاسم الكامل *</label>
                      <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                        placeholder="اسمك الكامل" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">رقم الهاتف *</label>
                      <input value={form.phone} onChange={(e) => update('phone', e.target.value)}
                        placeholder="+970 5X XXX XXXX" className="input-field" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">ملاحظات (اختياري)</label>
                      <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)}
                        placeholder="أي ملاحظات خاصة بالطلب..."
                        className="input-field resize-none h-20" rows={3} />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Link to="/cart"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                      <FiArrowRight size={14} />
                      العودة للسلة
                    </Link>
                    <button onClick={goNext} className="btn-primary mr-auto px-8">التالي</button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Address ───────────────────────────────────── */}
              {step === 2 && (
                <motion.div key="s2" variants={stepVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35 }}
                  className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <FiMapPin className="text-pink-400" size={18} />
                    <h2 className="text-lg font-bold text-white">عنوان التوصيل</h2>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1.5">الدولة *</label>
                        <input value={form.country} onChange={(e) => update('country', e.target.value)}
                          placeholder="فلسطين" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1.5">المدينة *</label>
                        <input value={form.city} onChange={(e) => update('city', e.target.value)}
                          placeholder="رام الله" className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">الشارع والحي *</label>
                      <input value={form.street} onChange={(e) => update('street', e.target.value)}
                        placeholder="شارع الإرسال، بناية 12، شقة 3" className="input-field" />
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-3">طريقة الدفع *</label>
                      <div className="space-y-2">
                        {PAYMENT_METHODS.map((m) => (
                          <label key={m.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                              m.disabled
                                ? 'border-white/5 opacity-50 cursor-not-allowed'
                                : form.paymentMethod === m.id
                                  ? 'border-pink-500/60 bg-pink-500/10 cursor-pointer'
                                  : 'border-white/10 hover:border-white/20 cursor-pointer'
                            }`}>
                            <input type="radio" name="payment" value={m.id}
                              checked={form.paymentMethod === m.id}
                              disabled={m.disabled}
                              onChange={() => !m.disabled && update('paymentMethod', m.id)}
                              className="accent-pink-500" />
                            <span className="text-2xl">{m.icon}</span>
                            <div>
                              <div className="text-white font-semibold text-sm">{m.label}</div>
                              <div className={`text-xs ${m.id === 'commission' && !m.disabled ? 'text-green-400' : m.id === 'commission' ? 'text-red-400' : 'text-gray-400'}`}>{m.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => { setError(''); setStep(1); }}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                      <FiArrowRight size={14} />
                      السابق
                    </button>
                    <button onClick={goNext} className="btn-primary mr-auto px-8">مراجعة الطلب</button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3 (review before placing, or success) ─────────── */}
              {step === 3 && orderId ? (
                /* ── Success ── */
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-3xl p-8 text-center border border-green-500/20">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                    <FiCheck size={36} className="text-green-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-2">تم تأكيد طلبك! 🎉</h2>
                  <p className="text-gray-400 mb-2">سيتواصل معك فريقنا على رقم <span className="text-white">{form.phone}</span></p>
                  <p className="text-gray-500 text-sm mb-6">رقم الطلب: <span className="text-pink-400 font-mono font-bold">#{orderId.slice(-8).toUpperCase()}</span></p>

                  <div className="glass-card rounded-2xl p-4 text-right mb-6 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">الاسم</span><span className="text-white">{form.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">الهاتف</span><span className="text-white" dir="ltr">{form.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">العنوان</span><span className="text-white">{form.city}، {form.street}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">الدفع</span><span className="text-white">{PAYMENT_METHODS.find(m => m.id === form.paymentMethod)?.label}</span></div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Link to="/" className="btn-outline">الرئيسية</Link>
                    <Link to="/products" className="btn-primary">طلب جديد</Link>
                  </div>
                </motion.div>
              ) : step === 3 && (
                /* ── Review step ── */
                <motion.div key="review" variants={stepVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35 }}
                  className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <FiLock className="text-pink-400" size={18} />
                    <h2 className="text-lg font-bold text-white">مراجعة وتأكيد الطلب</h2>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
                  )}

                  {/* Summary info */}
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: FiUser, label: 'الاسم', value: form.fullName },
                      { icon: FiPhone, label: 'الهاتف', value: form.phone },
                      { icon: FiMapPin, label: 'العنوان', value: `${form.country}، ${form.city}، ${form.street}` },
                      { icon: FiTruck, label: 'الشحن', value: 'شحن مجاني' },
                    ].map((r) => (
                      <div key={r.label} className="flex items-start gap-3 text-sm">
                        <r.icon size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-400 w-16 flex-shrink-0">{r.label}:</span>
                        <span className="text-white">{r.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(2)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                      <FiArrowRight size={14} />
                      تعديل
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={placeOrder}
                      disabled={loading}
                      className="btn-primary mr-auto px-8 flex items-center gap-2 py-3"
                    >
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><FiCheck size={16} /> تأكيد الطلب — ₪{totalPrice.toFixed(2)}</>
                      }
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Order sidebar */}
          {step < 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="glass-card rounded-3xl p-5 sticky top-20 border border-pink-500/20">
                <h3 className="text-base font-bold text-white mb-4">طلبك ({totalItems})</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0"
                        style={{ filter: `drop-shadow(0 4px 10px ${item.color}66)` }}>
                        <svg viewBox="0 0 280 300" className="w-full h-full">
                          <rect x="50" y="40" width="180" height="220" rx="16"
                            fill={item.color} opacity="0.8" />
                          <text x="140" y="165" textAnchor="middle" fill="white"
                            fontSize="40" fontWeight="bold" opacity="0.6">
                            {item.name.charAt(0)}
                          </text>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-semibold truncate">{item.nameAr}</div>
                        <div className="text-xs text-gray-400">×{item.quantity}</div>
                      </div>
                      <div className="text-xs font-bold" style={{ color: item.color }}>
                        ₪{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>المجموع الفرعي</span><span>₪{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>الشحن</span><span className="text-green-400">مجاني</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-1">
                    <span className="text-white">الإجمالي</span>
                    <span className="text-pink-400">₪{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

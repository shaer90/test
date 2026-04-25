import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  FiMenu, FiX, FiLogOut, FiShoppingBag, FiGrid, FiShoppingCart,
  FiLock, FiEye, FiEyeOff, FiCheck, FiPackage,
} from 'react-icons/fi';

// ── Change Password Modal ──────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword } = useAuth();
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleShow = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.current || !form.newPw || !form.confirm) return setMsg({ type: 'error', text: 'يرجى ملء جميع الحقول' });
    if (form.newPw.length < 6) return setMsg({ type: 'error', text: 'كلمة المرور الجديدة 6 أحرف على الأقل' });
    if (form.newPw !== form.confirm) return setMsg({ type: 'error', text: 'كلمتا المرور غير متطابقتان' });
    setLoading(true);
    try {
      await updatePassword(form.current, form.newPw);
      setMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح!' });
      setForm({ current: '', newPw: '', confirm: '' });
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ، حاول مجدداً' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FiLock size={17} className="text-pink-400" /> تغيير كلمة المرور
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                  : 'bg-red-400/10 text-red-400 border border-red-400/20'
              }`}
            >
              {msg.type === 'success' ? <FiCheck size={14} /> : <FiX size={14} />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-3">
          {([
            { key: 'current', label: 'كلمة المرور الحالية' },
            { key: 'newPw', label: 'كلمة المرور الجديدة' },
            { key: 'confirm', label: 'تأكيد كلمة المرور' },
          ] as { key: keyof typeof form; label: string }[]).map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
              <div className="relative">
                <input
                  type={show[f.key] ? 'text' : 'password'}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input-field w-full pl-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShow(f.key)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {show[f.key] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <FiLock size={14} />}
            {loading ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  const isHome = location.pathname === '/';

  const navBg = scrolled
    ? isHome
      ? 'rgba(255,242,250,0.88)'
      : 'rgba(20,10,26,0.88)'
    : 'transparent';

  const linkColor = (active: boolean) => {
    if (active) return 'text-pink-500';
    if (isHome && scrolled) return 'text-gray-700 hover:text-gray-900';
    return 'text-gray-300 hover:text-white';
  };

  const links = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
        style={{
          background: navBg,
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(196,113,139,.2)' : 'none',
          boxShadow: scrolled ? '0 2px 24px rgba(196,113,139,.12)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.img
                src="/logo.png"
                alt="Allsence"
                whileHover={{ scale: 1.05 }}
                style={{ height: 48, width: 'auto', objectFit: 'contain' }}
              />
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-semibold transition-colors ${linkColor(location.pathname === l.to)}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">

              {/* Cart icon */}
              <Link to="/cart" className={`relative p-2 transition-colors ${isHome && scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                <FiShoppingCart size={20} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 glass-card px-3 py-2 rounded-full text-sm font-semibold text-white hover:border-pink-500/50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-l from-pink-600 to-pink-400 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name.split(' ')[0]}</span>
                  </button>

                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 top-12 w-52 glass-card rounded-2xl py-2 shadow-2xl"
                      >
                        {user.role === 'member' && (
                          <Link
                            to="/dashboard"
                            onClick={() => setDropOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <FiGrid className="text-pink-400" />
                            لوحة التحكم
                          </Link>
                        )}
                        {(user.role === 'super_admin' || user.role === 'admin') && (
                          <Link
                            to="/admin"
                            onClick={() => setDropOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <FiGrid className="text-pink-400" />
                            لوحة الإدارة
                          </Link>
                        )}
                        <Link
                          to="/products"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <FiShoppingBag className="text-pink-400" />
                          تسوق الآن
                        </Link>
                        {user.role === 'customer' && (
                          <Link
                            to="/orders"
                            onClick={() => setDropOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <FiPackage className="text-pink-400" />
                            طلباتي
                          </Link>
                        )}
                        <hr className="border-white/10 my-1" />
                        <button
                          onClick={() => { setDropOpen(false); setPwModalOpen(true); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <FiLock className="text-pink-400" />
                          تغيير كلمة المرور
                        </button>
                        <hr className="border-white/10 my-1" />
                        <button
                          onClick={() => { setDropOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                          <FiLogOut />
                          تسجيل الخروج
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login" className={`text-sm font-semibold transition-colors ${isHome && scrolled ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                    تسجيل الدخول
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-5">
                    انضم إلينا
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: cart + menu */}
            <div className="md:hidden flex items-center gap-1">
              <Link to="/cart" className="relative p-2 text-gray-300">
                <FiShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-semibold transition-all"
                  >
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    {user.role === 'member' && (
                      <Link to="/dashboard" className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-semibold">
                        لوحة التحكم
                      </Link>
                    )}
                    {(user.role === 'super_admin' || user.role === 'admin') && (
                      <Link to="/admin" className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-semibold">
                        لوحة الإدارة
                      </Link>
                    )}
                    {user.role === 'customer' && (
                      <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-semibold">
                        <FiPackage size={15} className="text-pink-400" />
                        طلباتي
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); setPwModalOpen(true); }}
                      className="w-full text-right px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-semibold flex items-center gap-2"
                    >
                      <FiLock size={15} className="text-pink-400" />
                      تغيير كلمة المرور
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-3 rounded-xl text-red-400 hover:bg-white/5 font-semibold"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="pt-2 flex flex-col gap-2">
                    <Link to="/login" className="btn-outline text-center">تسجيل الدخول</Link>
                    <Link to="/register" className="btn-primary text-center">انضم إلينا</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Change Password Modal */}
      <AnimatePresence>
        {pwModalOpen && <ChangePasswordModal onClose={() => setPwModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

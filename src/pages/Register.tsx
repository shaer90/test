import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiEye, FiEyeOff, FiCheck, FiUser, FiUsers, FiBell } from 'react-icons/fi';
import CountrySelect from '../components/CountrySelect';

type Role = 'customer' | 'member';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') as Role | null;
  const urlRef = searchParams.get('ref');

  const [step, setStep] = useState<1 | 2>(urlType ? 2 : 1);
  const [role, setRole] = useState<Role>(urlType || 'customer');
  const [roleLocked] = useState(!!urlType);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [checkingRef, setCheckingRef] = useState(false);

  const [form, setForm] = useState({
    username: '',
    name: '',
    phone: '',
    country: '',
    city: '',
    password: '',
    confirmPassword: '',
    sponsorCode: urlRef || '',
    ageGroup: '',
    reminderEnabled: false,
    lastPeriodDate: '',
  });

  // Auto-check referral code from URL
  useEffect(() => {
    if (urlRef) checkReferralCode(urlRef);
  }, [urlRef]);

  const checkReferralCode = async (code: string) => {
    if (!code || code.length < 3) { setReferrerName(''); return; }
    setCheckingRef(true);
    try {
      const res = await authAPI.checkReferral(code);
      const name = (res.data as { sponsor?: { name?: string } }).sponsor?.name || '';
      setReferrerName(name);
    } catch {
      setReferrerName('');
    } finally {
      setCheckingRef(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }


    setLoading(true);
    try {
      await register({
        username: form.username,
        name: form.name,
        phone: form.phone,
        password: form.password,
        role,
        sponsorCode: form.sponsorCode || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        ageGroup: form.ageGroup || undefined,
        reminderEnabled: form.reminderEnabled,
        lastPeriodDate: (form.reminderEnabled && form.lastPeriodDate) ? form.lastPeriodDate : undefined,
      });
      if (role === 'member') {
        sessionStorage.setItem('allsence_welcome', 'true');
        if (referrerName) sessionStorage.setItem('allsence_welcome_sponsor', referrerName);
        navigate('/welcome');
      } else {
        navigate('/products');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light-page min-h-screen pt-16 flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-black mb-2">
              <span className="text-gradient-pink">all</span>
              <span className="text-white">sence</span>
            </div>
            <h2 className="text-xl font-bold text-white">إنشاء حساب جديد</h2>

            {/* Progress */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? 'bg-pink-600 text-white' : 'bg-white/10 text-gray-500'
                    }`}
                  >
                    {step > s ? <FiCheck size={12} /> : s}
                  </div>
                  {s < 2 && <div className={`w-12 h-0.5 transition-all ${step > s ? 'bg-pink-600' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 1: Choose Role ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-center text-gray-300 mb-6">كيف تريدين الانضمام؟</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Customer */}
                  <button
                    onClick={() => setRole('customer')}
                    className={`p-5 rounded-2xl border-2 text-right transition-all ${
                      role === 'customer'
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mb-3">
                      <FiUser className="text-pink-400 text-lg" />
                    </div>
                    <div className="font-bold text-white mb-1">زبونة</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      تسوقي واطلبي المنتجات بسهولة
                    </div>
                  </button>

                  {/* Member */}
                  <button
                    onClick={() => setRole('member')}
                    className={`p-5 rounded-2xl border-2 text-right transition-all ${
                      role === 'member'
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mb-3">
                      <FiUsers className="text-pink-400 text-lg" />
                    </div>
                    <div className="font-bold text-white mb-1">عضوة</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      احصلي على كود إحالة واكسبي عمولة من فريقك
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3.5"
                >
                  التالي
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Fill Form ───────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Role indicator */}
                {!roleLocked && (
                  <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                    {role === 'member' ? <FiUsers className="text-pink-400" /> : <FiUser className="text-pink-400" />}
                    <span className="text-sm text-gray-300">
                      التسجيل كـ <strong className="text-pink-400">{role === 'member' ? 'عضوة' : 'زبونة'}</strong>
                    </span>
                    <button
                      onClick={() => setStep(1)}
                      className="mr-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      تغيير
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">الاسم الكامل *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="الاسم الكامل"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">اسم المستخدم *</label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                          setForm({ ...form, username: v });
                        }}
                        placeholder="username"
                        className="input-field"
                        required
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 mt-1">English letters and numbers only</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">رقم الهاتف *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+970 5X XXX XXXX"
                      className="input-field"
                      required
                      dir="ltr"
                    />
                  </div>

                  {/* Age group */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">الفئة العمرية</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['15-20', '21-30', '31-40', '41-50', '51+'].map((ag) => (
                        <button
                          key={ag}
                          type="button"
                          onClick={() => setForm({ ...form, ageGroup: ag })}
                          className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                            form.ageGroup === ag
                              ? 'bg-pink-600 border-pink-500 text-white'
                              : 'border-white/10 text-gray-400 hover:border-pink-500/40 hover:text-white'
                          }`}
                        >
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reminder toggle */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, reminderEnabled: !form.reminderEnabled, lastPeriodDate: '' })}
                      className={`w-full flex items-center justify-between gap-3 transition-colors ${form.reminderEnabled ? 'text-pink-400' : 'text-gray-400'}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <FiBell size={15} />
                        هل تريدين تذكيرك بموعد شراء الفوط؟
                      </span>
                      <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.reminderEnabled ? 'bg-pink-500' : 'bg-white/20'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.reminderEnabled ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {form.reminderEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <label className="block text-xs text-gray-400 mb-1.5">
                            متى انتهت آخر دورة شهرية لك؟
                          </label>
                          <div className="flex gap-2" dir="ltr">
                            <select
                              value={form.lastPeriodDate.split('-')[0] || ''}
                              onChange={(e) => {
                                const month = e.target.value;
                                const day = form.lastPeriodDate.split('-')[1] || '';
                                setForm({ ...form, lastPeriodDate: month && day ? `${month}-${day}` : '' });
                              }}
                              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                              style={{ background: '#f5eef2', border: '1px solid rgba(196,113,139,0.3)', color: '#2c1a2e' }}
                              required={form.reminderEnabled}
                            >
                              <option value="">الشهر</option>
                              {[
                                ['01','يناير'],['02','فبراير'],['03','مارس'],['04','أبريل'],
                                ['05','مايو'],['06','يونيو'],['07','يوليو'],['08','أغسطس'],
                                ['09','سبتمبر'],['10','أكتوبر'],['11','نوفمبر'],['12','ديسمبر'],
                              ].map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                            <select
                              value={form.lastPeriodDate.split('-')[1] || ''}
                              onChange={(e) => {
                                const day = e.target.value;
                                const month = form.lastPeriodDate.split('-')[0] || '';
                                setForm({ ...form, lastPeriodDate: month && day ? `${month}-${day}` : '' });
                              }}
                              className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                              style={{ background: '#f5eef2', border: '1px solid rgba(196,113,139,0.3)', color: '#2c1a2e' }}
                              required={form.reminderEnabled}
                            >
                              <option value="">اليوم</option>
                              {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5">
                            سنرسل لك تذكيراً كل 28 يوم 🔔
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {role === 'member' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1.5">الدولة *</label>
                        <CountrySelect
                          value={form.country}
                          onChange={(v) => setForm({ ...form, country: v })}
                          required={role === 'member'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1.5">المدينة *</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="رام الله"
                          className="input-field"
                          required={role === 'member'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sponsor Code — members only */}
                  {role === 'member' && <div>
                    <label className="block text-sm text-gray-300 mb-1.5">
                      كود الإحالة (اختياري)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.sponsorCode}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setForm({ ...form, sponsorCode: v });
                          checkReferralCode(v);
                        }}
                        placeholder="مثال: AB123456"
                        className={`input-field pr-9 ${!!urlRef ? 'opacity-70 cursor-not-allowed' : ''}`}
                        readOnly={!!urlRef}
                        dir="ltr"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingRef ? (
                          <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                        ) : referrerName ? (
                          <FiCheck className="text-green-400" size={16} />
                        ) : null}
                      </div>
                    </div>
                    {referrerName && (
                      <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                        <FiCheck size={12} /> تمت الإضافة عبر: <strong>{referrerName}</strong>
                      </p>
                    )}
                  </div>}

                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">كلمة المرور *</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="6 أحرف على الأقل"
                        className="input-field pl-10"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {showPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">تأكيد كلمة المرور *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="أعيدي كتابة كلمة المرور"
                        className="input-field pl-10"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {showConfirmPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-1"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'إنشاء الحساب'
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center text-sm text-gray-400">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

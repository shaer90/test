import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { verificationAPI } from '../services/api';
import {
  FiShield, FiUpload, FiCheck, FiArrowRight, FiX, FiCamera,
} from 'react-icons/fi';

interface VerificationData {
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
}

export default function VerifyAccount() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<VerificationData>({
    idType: 'national_id',
    idNumber: '',
    fullName: user?.name || '',
    dateOfBirth: '',
    phone: user?.phone || '',
  });
  const [idImage, setIdImage] = useState<string | null>(null);
  const [idImageName, setIdImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof VerificationData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('حجم الصورة يجب أن يكون أقل من 5 ميغابايت'); return; }
    if (!file.type.startsWith('image/')) { setError('يرجى رفع صورة فقط (JPG, PNG, WebP)'); return; }
    const headerReader = new FileReader();
    headerReader.onload = (ev) => {
      const arr = new Uint8Array(ev.target?.result as ArrayBuffer).slice(0, 4);
      const valid =
        (arr[0] === 0xFF && arr[1] === 0xD8) ||
        (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) ||
        (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46);
      if (!valid) { setError('نوع الملف غير صالح. يُسمح فقط بـ JPG و PNG و WebP'); return; }
      setIdImageName(file.name);
      const dr = new FileReader();
      dr.onloadend = () => setIdImage(dr.result as string);
      dr.readAsDataURL(file);
      setError('');
    };
    headerReader.readAsArrayBuffer(file.slice(0, 4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.idNumber) return setError('يرجى إدخال رقم الهوية');
    if (!form.fullName) return setError('يرجى إدخال الاسم الكامل');
    if (!form.phone) return setError('يرجى إدخال رقم الهاتف');
    if (!form.dateOfBirth) return setError('يرجى إدخال تاريخ الميلاد');
    if (!idImage) return setError('يرجى رفع صورة الهوية');

    setLoading(true);
    try {
      await verificationAPI.submit({
        idType: form.idType,
        idNumber: form.idNumber,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone,
        idImage,
      });
      updateUser({ verificationStatus: 'pending', isVerified: false });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="light-page min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-6"
          >
            <FiCheck size={40} className="text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-2">تم إرسال طلب التوثيق!</h2>
          <p className="text-gray-400 mb-2">سيتم مراجعة طلبك من قبل الإدارة خلال 24-48 ساعة</p>
          <p className="text-sm text-gray-500 mb-8">ستتلقى إشعاراً عند اتخاذ قرار بشأن طلبك</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center justify-center gap-2 mx-auto"
          >
            <FiArrowRight size={16} />
            العودة للوحة التحكم
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 glass-card rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <FiArrowRight size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <FiShield className="text-pink-400" />
                توثيق الحساب
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">أدخل بياناتك الشخصية كما تظهر في الهوية الرسمية</p>
            </div>
          </div>
        </motion.div>


        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-6 space-y-5"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2"
              >
                <FiX size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ID Type */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">نوع الوثيقة</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'national_id', label: 'هوية وطنية' },
                { value: 'passport', label: 'جواز سفر' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('idType', t.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    form.idType === t.value
                      ? 'bg-pink-600 text-white'
                      : 'glass-card text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">الاسم الكامل كما في الهوية</label>
            <input
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className="input-field w-full"
              placeholder="الاسم الرباعي"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">رقم الهاتف</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="input-field w-full font-mono"
              placeholder="+970 5X XXX XXXX"
              dir="ltr"
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">رقم الهوية / الجواز</label>
            <input
              value={form.idNumber}
              onChange={(e) => set('idNumber', e.target.value)}
              className="input-field w-full font-mono"
              placeholder="000000000"
              dir="ltr"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">تاريخ الميلاد</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="input-field w-full"
              dir="ltr"
            />
          </div>

          {/* ID Image Upload */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">صورة الهوية</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                idImage
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-white/10 hover:border-pink-500/30 hover:bg-pink-500/5'
              }`}
            >
              {idImage ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto border border-white/10">
                    <img src={idImage} alt="ID preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-green-400 font-medium">
                    <FiCheck className="inline ml-1" size={12} />
                    {idImageName}
                  </span>
                  <span className="text-xs text-gray-500">انقر للتغيير</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto">
                    <FiCamera size={22} className="text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400 font-medium">انقر لرفع صورة الهوية</div>
                  <div className="text-xs">JPG, PNG — حجم أقصى 5MB</div>
                </div>
              )}
            </button>
          </div>

          {/* Privacy note */}
          <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-500 flex gap-2">
            <FiShield size={14} className="text-pink-400 flex-shrink-0 mt-0.5" />
            <span>بياناتك محمية وآمنة تماماً. يتم استخدامها فقط للتحقق من هويتك ولن تُشارك مع أي طرف ثالث.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جارٍ الرفع...
              </>
            ) : (
              <>
                <FiUpload size={16} />
                إرسال طلب التوثيق
              </>
            )}
          </button>
        </motion.form>

      </div>
    </div>
  );
}

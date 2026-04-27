import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiCopy, FiCheck, FiArrowLeft } from 'react-icons/fi';

export default function WelcomeMember() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sponsorName, setSponsorName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('allsence_welcome') !== 'true') {
      navigate('/', { replace: true });
      return;
    }
    const s = sessionStorage.getItem('allsence_welcome_sponsor');
    if (s) setSponsorName(s);
  }, []);

  const handleContinue = () => {
    sessionStorage.removeItem('allsence_welcome');
    sessionStorage.removeItem('allsence_welcome_sponsor');
    navigate('/dashboard', { replace: true });
  };

  const copyCode = () => {
    if (user?.subscriberCode) {
      navigator.clipboard.writeText(user.subscriberCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="light-page min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-green-400/10 border-2 border-green-400/30 flex items-center justify-center mx-auto mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 260 }}
          >
            <FiCheck size={40} className="text-green-400" />
          </motion.div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-2">
            أهلاً بك في عائلة{' '}
            <span className="text-gradient-pink">allsence</span> 🎉
          </h1>
          <p className="text-gray-400">
            مرحباً <span className="text-white font-semibold">{user?.name}</span>، تم تسجيلك بنجاح كعضو
          </p>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-3xl p-6 mb-5 space-y-4"
        >
          {/* Subscriber code */}
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">كود الإحالة الخاص بك</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-black text-pink-400 font-mono tracking-widest">
                {user?.subscriberCode}
              </span>
              <button
                onClick={copyCode}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
              >
                {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">شارك هذا الكود واكسب عمولة من كل انضمام</p>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white">{user?.name}</span>
              <span className="text-gray-400">الاسم</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-white" dir="ltr">{user?.username}</span>
              <span className="text-gray-400">اسم المستخدم</span>
            </div>
            {user?.country && (
              <>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-white">{user.country}</span>
                  <span className="text-gray-400">الدولة</span>
                </div>
              </>
            )}
            {sponsorName && (
              <>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-semibold">{sponsorName}</span>
                  <span className="text-gray-400">تمت الإحالة من</span>
                </div>
              </>
            )}
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-white">{new Date().toLocaleDateString('ar-EG')}</span>
              <span className="text-gray-400">تاريخ التسجيل</span>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-3xl p-6 mb-6"
        >
          <h3 className="text-sm font-bold text-white mb-4">خطواتك القادمة</h3>
          <div className="space-y-3">
            {[
              { n: '١', text: 'وثّق حسابك للحصول على الكود رسمياً', color: 'text-pink-400' },
              { n: '٢', text: 'شارك كودك مع أصدقائك واكسب عمولة', color: 'text-purple-400' },
              { n: '٣', text: 'تسوقي واستمتعي بمنتجات allsence', color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-xs font-bold ${s.color}`}>
                  {s.n}
                </div>
                <p className="text-sm text-gray-300 pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
        >
          الذهاب للوحة التحكم
          <FiArrowLeft size={18} />
        </motion.button>

      </div>
    </div>
  );
}

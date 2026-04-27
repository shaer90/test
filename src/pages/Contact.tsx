import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiPhone, FiMapPin,
  FiInstagram, FiMessageCircle, FiClock,
} from 'react-icons/fi';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const CHANNELS = [
  {
    icon: FiPhone,
    label: 'واتساب',
    value: '+970 59-900-0000',
    sub: 'متاح ٩ ص — ١٠ م',
    href: 'https://wa.me/970599000000',
    color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: FiMail,
    label: 'البريد الإلكتروني',
    value: 'hello@allsence.com',
    sub: 'نرد خلال ٢٤ ساعة',
    href: 'mailto:hello@allsence.com',
    color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: FiInstagram,
    label: 'إنستغرام',
    value: '@allsence.official',
    sub: 'تابعنا للمزيد',
    href: '#',
    color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: FiMapPin,
    label: 'الموقع',
    value: 'رام الله، فلسطين',
    sub: 'نشحن لكل مكان',
    href: '#',
    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20',
  },
];

const FAQ = [
  {
    q: 'كم يستغرق التوصيل؟',
    a: 'يصل طلبك خلال ٢-٥ أيام عمل حسب موقعك. نوفر تتبعاً فورياً لطلبك.',
  },
  {
    q: 'هل يمكنني إرجاع المنتج؟',
    a: 'نعم، نقبل الإرجاع خلال ٧ أيام من الاستلام إذا كان المنتج بحالته الأصلية.',
  },
  {
    q: 'كيف أنضم لبرنامج العضوية؟',
    a: 'سجّل حساباً جديداً واختر "عضو"، ستحصل على كود إحالة خاص بك فوراً.',
  },
  {
    q: 'هل العطور أصلية؟',
    a: 'نعم ١٠٠٪. كل منتجاتنا مصدرها مباشر من الموزعين المعتمدين مع ضمان الأصالة.',
  },
];

export default function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="light-page min-h-screen pt-20 pb-20" dir="rtl" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>

      {/* ── Hero ── */}
      <section className="relative px-4 pt-10 pb-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-80 h-80 bg-pink-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-purple-600/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-5"
          >
            <FiMessageCircle size={12} /> تواصل معنا
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            نحن هنا{' '}
            <span className="text-gradient-pink">من أجلك</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg leading-relaxed"
          >
            سؤال، اقتراح، أو مجرد تحية — نحن نسمع ونرد بكل سعادة.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Contact Channels ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {CHANNELS.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className={`glass-card rounded-3xl p-5 border ${c.bg} flex flex-col gap-3 hover:scale-[1.03] transition-transform`}
            >
              <div className={`w-10 h-10 rounded-2xl ${c.bg} border flex items-center justify-center`}>
                <c.icon size={18} className={c.color} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{c.label}</div>
                <div className={`text-sm font-semibold ${c.color}`}>{c.value}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                  <FiClock size={10} /> {c.sub}
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mb-16">

          {/* ── FAQ ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-black text-white mb-1">الأسئلة الشائعة</h2>
            <p className="text-sm text-gray-500 mb-6">إجابات على أكثر الأسئلة شيوعاً</p>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-right gap-3"
                  >
                    <span className="text-sm font-semibold text-white">{item.q}</span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-pink-400 flex-shrink-0 text-lg font-bold"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div className="glass-card rounded-2xl p-5 mt-5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <FiClock size={15} className="text-pink-400" />
                <span className="text-sm font-bold text-white">ساعات العمل</span>
              </div>
              <div className="space-y-1.5 text-sm">
                {[
                  { day: 'السبت — الخميس', time: '٩ ص — ١٠ م' },
                  { day: 'الجمعة', time: '١٢ ظ — ٨ م' },
                ].map((r) => (
                  <div key={r.day} className="flex justify-between text-gray-400">
                    <span>{r.day}</span>
                    <span className="text-white font-medium">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

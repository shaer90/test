import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiStar, FiUsers, FiShield, FiArrowLeft, FiPackage,
} from 'react-icons/fi';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55 } }),
};

const VALUES = [
  {
    icon: FiHeart,
    title: 'الجودة أولاً',
    text: 'نختار كل منتج بعناية فائقة لنضمن لك تجربة استثنائية في كل استخدام.',
    color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: FiStar,
    title: 'الفخامة بمتناول الجميع',
    text: 'نؤمن أن العطور الفاخرة حق للجميع، لذا نقدم أسعاراً عادلة دون المساومة على الجودة.',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    icon: FiUsers,
    title: 'مجتمع حقيقي',
    text: 'أكثر من مجرد متجر — نبني مجتمعاً من المحبين للعطور يتشاركون الشغف والخبرة.',
    color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: FiShield,
    title: 'الثقة والشفافية',
    text: 'كل منتج موثق وكل معاملة شفافة. ثقتك بنا أغلى من أي ربح.',
    color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
  },
];

const STATS = [
  { value: '+500', label: 'عميل سعيد' },
  { value: '+50', label: 'منتج فاخر' },
  { value: '٣', label: 'سنوات خبرة' },
  { value: '٩٨٪', label: 'رضا العملاء' },
];

const TEAM = [
  { name: 'لينا سالم', role: 'المؤسسة والرئيسة التنفيذية', initials: 'ل' },
  { name: 'كريم الأحمد', role: 'مدير المنتجات', initials: 'ك' },
  { name: 'ريم العمري', role: 'مسؤولة خدمة العملاء', initials: 'ر' },
];

export default function About() {
  return (
    <div className="light-page min-h-screen pt-20 pb-20" dir="rtl" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>

      {/* ── Hero ── */}
      <section className="relative px-4 pt-10 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-6"
          >
            <FiPackage size={12} /> عن allsence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight"
          >
            نحن نصنع{' '}
            <span className="text-gradient-pink">لحظات لا تُنسى</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            allsence وُلدت من شغف حقيقي بعالم العطور. مهمتنا أن نوصل إليك أجمل العطور
            الفاخرة من أرجاء العالم، مع تجربة تسوق لا مثيل لها.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link to="/products" className="btn-primary px-7 py-3 text-base flex items-center gap-2">
              <FiStar size={16} /> اكتشف منتجاتنا
            </Link>
            <Link to="/contact" className="glass-card px-7 py-3 rounded-2xl text-gray-300 hover:text-white text-base font-semibold transition-colors flex items-center gap-2">
              <FiUsers size={16} /> تواصل معنا
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="glass-card rounded-3xl p-6 text-center border border-white/10"
              >
                <div className="text-3xl font-black text-gradient-pink mb-1">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-600/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-5">
                <FiHeart size={12} /> قصتنا
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-5">
                من شغف صغير إلى مشروع كبير
              </h2>
              <div className="space-y-4 text-gray-400 leading-relaxed text-base">
                <p>
                  بدأت allsence عام ٢٠٢١ من فكرة بسيطة: لماذا يكون الوصول إلى العطور الفاخرة
                  صعباً ومكلفاً؟ أردنا أن نغير ذلك.
                </p>
                <p>
                  بدأنا بمجموعة صغيرة من العطور المختارة بعناية، وسرعان ما نما مجتمعنا من
                  عشرات إلى مئات العملاء الذين يثقون بنا ويعودون إلينا مراراً.
                </p>
                <p>
                  اليوم، نفخر بتقديم أكثر من ٥٠ عطراً فاخراً من أشهر الماركات العالمية،
                  مع نظام عضوية يتيح لأعضائنا تحقيق دخل إضافي من خلال مشاركة ما يحبون.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">قيمنا</h2>
            <p className="text-gray-400">المبادئ التي تحكم كل قرار نتخذه</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className={`glass-card rounded-3xl p-6 border ${v.bg} flex gap-4`}
              >
                <div className={`w-12 h-12 rounded-2xl ${v.bg} border flex items-center justify-center flex-shrink-0`}>
                  <v.icon size={20} className={v.color} />
                </div>
                <div>
                  <h3 className={`font-bold text-white mb-2`}>{v.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{v.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">فريقنا</h2>
            <p className="text-gray-400">الأشخاص الذين يجعلون allsence ما هي عليه</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {TEAM.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="glass-card rounded-3xl p-6 text-center border border-white/10"
              >
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-600/40 to-purple-600/40 border border-pink-500/30 flex items-center justify-center text-2xl font-black text-pink-300 mx-auto mb-4">
                  {t.initials}
                </div>
                <div className="font-bold text-white mb-1">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 text-center border border-pink-500/20"
            style={{ boxShadow: '0 8px 60px rgba(233,30,140,0.1)' }}
          >
            <h2 className="text-2xl font-black text-white mb-3">هل أنت مستعد للانضمام؟</h2>
            <p className="text-gray-400 mb-7">انضم إلى مجتمعنا واستمتع بمميزات العضوية الحصرية</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary px-8 py-3 flex items-center gap-2">
                <FiUsers size={16} /> انضم إلينا الآن
              </Link>
              <Link to="/contact" className="glass-card px-8 py-3 rounded-2xl text-gray-300 hover:text-white font-semibold transition-colors flex items-center gap-2">
                <FiArrowLeft size={16} /> تواصل معنا
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

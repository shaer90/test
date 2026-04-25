import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiShield, FiDroplet, FiStar, FiUsers } from 'react-icons/fi';
import { productsAPI } from '../services/api';
import { Product } from '../data/products';

const ROSE    = '#c4718b';
const ROSE_DK = '#9e4d68';
const MAUVE   = '#a888c4';
const PLUM    = '#2c1a2e';
const MID     = '#7a5c6e';
const LT      = '#f5eef2';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.09, ease: EASE } }),
};

type CSSProps = React.CSSProperties;

function Sec({ children, style }: { children: React.ReactNode; style?: CSSProps }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} style={style}>
      {children}
    </motion.section>
  );
}

function SecHead({ title, sub }: { title: string; sub: string }) {
  return (
    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
      <h2 style={{ fontSize: 'clamp(26px,3.8vw,40px)', fontWeight: 900, color: PLUM, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 15, color: MID, marginTop: 8, lineHeight: 1.65 }}>{sub}</p>
      <div style={{ width: 48, height: 3, background: ROSE, borderRadius: 2, margin: '14px auto 0' }} />
    </motion.div>
  );
}

const CARD: Record<string, { desc: string }> = {
  'daily-pads':    { desc: '48 قطعة يومية فاعلة — Ultra Thin للتعايش دون ألم.' },
  'ultra-night':   { desc: 'نومي بثقة كاملة — Liquid Lock GEL وجانبان واقيان.' },
  'plus':          { desc: 'للأيام الصعبة — Extra Large مع امتصاص مضاعف.' },
  'premium-xxl':   { desc: 'مخصصة للبشرة الحساسة وPCOS — 4 أجنحة XXL.' },
  'premium-pants': { desc: 'حرية حركة كاملة — Super Comfort Pearl Surface.' },
};

const CARD_THEME: Record<string, { bg: [string,string]; color: string }> = {
  'daily-pads':    { bg: ['#2a0f1e','#180810'], color: '#e87898' },
  'ultra-night':   { bg: ['#0d1a3d','#060d24'], color: '#7090d8' },
  'plus':          { bg: ['#1a0d3a','#0d0620'], color: '#a870d8' },
  'premium-xxl':   { bg: ['#2a1500','#180d00'], color: '#e09848' },
  'premium-pants': { bg: ['#2a0d18','#180608'], color: '#d87090' },
};

function ProductCard({ p, i }: { p: Product; i: number }) {
  const theme = CARD_THEME[p.id] ?? CARD_THEME['daily-pads'];
  const badge = (p as any).badge || '';
  const count = String((p as any).count || '');
  const desc  = CARD[p.id]?.desc || '';

  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      className="card-3d"
      style={{
        borderRadius: 24, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        background: `linear-gradient(160deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 100%)`,
        border: `1px solid ${theme.color}25`,
        boxShadow: `0 8px 40px ${theme.color}20`,
        display: 'flex', flexDirection: 'column', padding: 24,
      } as CSSProps}
    >
      {/* Badge */}
      {badge && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 50,
          color: '#fff', background: theme.color,
        }}>{badge}</div>
      )}

      {/* Large count watermark */}
      <div style={{
        fontSize: 72, fontWeight: 900, color: 'rgba(255,255,255,.07)',
        lineHeight: 1, marginBottom: 4, userSelect: 'none',
      } as CSSProps}>{count}</div>

      {/* Name */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>allsence</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{p.name}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.color, marginTop: 2 }}>{p.nameAr}</div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65, marginBottom: 20, flex: 1 }}>{desc}</p>

      {/* CTA */}
      <Link to="/products" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 14, fontWeight: 800, color: theme.color, textDecoration: 'none',
      }}>اطلبي الآن ←</Link>

      {/* Glow orb */}
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: theme.color, opacity: .15, filter: 'blur(40px)',
        pointerEvents: 'none',
      }}/>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productsAPI.getAll()
      .then(res => {
        const list: Product[] = (res.data as { products?: Product[] })?.products || [];
        setProducts(list);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#fdf8f5', color: PLUM }}>

      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0px); opacity: 1; }
          25%  { transform: translateY(25vh)  rotate(130deg) translateX(18px); }
          50%  { transform: translateY(50vh)  rotate(260deg) translateX(-12px); }
          75%  { transform: translateY(75vh)  rotate(400deg) translateX(16px); }
          100% { transform: translateY(105vh) rotate(540deg) translateX(-8px); opacity: 0; }
        }
        @keyframes shimmerText {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-15px); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 20px rgba(196,113,139,0.3); }
          50%     { box-shadow: 0 0 40px rgba(196,113,139,0.7); }
        }
        .hero-float   { animation: float 5s ease-in-out infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .shimmer {
          background: linear-gradient(90deg,#9e4d68,#a888c4,#c4718b,#9e4d68);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmerText 3.5s linear infinite;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s;
        }
        .card-3d:hover {
          transform: perspective(1000px) rotateY(-6deg) rotateX(3deg) scale(1.03);
        }
        @media (max-width: 900px) {
          .hero-grid  { grid-template-columns: 1fr !important; }
          .hero-vis   { display: none !important; }
          .hiw-grid   { grid-template-columns: 1fr !important; }
          .hiw-photo  { display: none !important; }
          .prods-grid { grid-template-columns: repeat(2,1fr) !important; }
          .mlm-grid   { grid-template-columns: 1fr !important; }
          .mlm-photo  { display: none !important; }
          .testi-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 580px) {
          .prods-grid { grid-template-columns: repeat(2,1fr) !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(130deg,#c4b4e8 0%,#d4c0f0 25%,#e4ccec 55%,#f0d8e8 80%,#fae4f0 100%)',
        minHeight: 520,
      }}>
        <div style={{ position:'absolute', width:600, height:500, borderRadius:'50%', filter:'blur(110px)', background:'rgba(160,120,210,.28)', top:'-20%', left:'-8%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:500, height:400, borderRadius:'50%', filter:'blur(100px)', background:'rgba(240,170,195,.22)', bottom:'-10%', right:'-5%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:80, background:'linear-gradient(to bottom,rgba(60,30,70,.32),transparent)', pointerEvents:'none', zIndex:2 }} />

        {/* Petals */}
        {[
          { left:'5%',  dur:8,   delay:0,   w:16, h:24, color:'rgba(220,120,155,.7)', rx:'60% 30% 60% 30%', rot:-25 },
          { left:'15%', dur:11,  delay:1.8, w:11, h:17, color:'rgba(196,100,130,.6)', rx:'50% 40% 50% 40%', rot:18  },
          { left:'28%', dur:9,   delay:0.6, w:18, h:27, color:'rgba(240,150,170,.75)',rx:'55% 35% 55% 35%', rot:-40 },
          { left:'44%', dur:12,  delay:2.4, w:13, h:20, color:'rgba(200,140,210,.65)',rx:'45% 55% 45% 55%', rot:30  },
          { left:'58%', dur:8.5, delay:0.3, w:15, h:22, color:'rgba(220,120,155,.65)',rx:'60% 30% 60% 30%', rot:-18 },
          { left:'72%', dur:10,  delay:1.5, w:10, h:15, color:'rgba(196,100,130,.55)',rx:'50% 40% 50% 40%', rot:42  },
          { left:'86%', dur:13,  delay:1.0, w:20, h:30, color:'rgba(240,150,170,.7)', rx:'55% 35% 55% 35%', rot:-32 },
        ].map((p, i) => (
          <div key={i} style={{
            position:'absolute', top:'-30px', left:p.left, zIndex:4,
            width:p.w, height:p.h, background:p.color, borderRadius:p.rx,
            transform:`rotate(${p.rot}deg)`, pointerEvents:'none',
            animationName:'petalFall', animationDuration:`${p.dur}s`,
            animationDelay:`${p.delay}s`, animationTimingFunction:'linear',
            animationIterationCount:'infinite',
          } as CSSProps} />
        ))}

        {/* Cloud wave at bottom */}
        <div style={{ position:'absolute', bottom:-2, left:0, right:0, pointerEvents:'none', zIndex:2 }}>
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ width:'100%', height:160, display:'block' }}>
            <path d="M0,140 Q120,80 240,120 Q360,160 480,110 Q600,60 720,110 Q840,160 960,115 Q1080,70 1200,115 Q1320,160 1440,120 L1440,160 L0,160 Z" fill="rgba(255,255,255,0.9)"/>
            <path d="M0,155 Q180,110 360,145 Q540,180 720,140 Q900,100 1080,140 Q1260,180 1440,150 L1440,160 L0,160 Z" fill="white"/>
          </svg>
        </div>

        {/* Centered content */}
        <div style={{
          maxWidth: 700, margin:'0 auto', padding:'100px 32px 180px',
          display:'flex', flexDirection:'column', alignItems:'center',
          textAlign:'center', position:'relative', zIndex:3,
        }}>
          <motion.div
            initial={{ opacity:0, y:28 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, ease:EASE }}
          >
            <h1 style={{
              fontSize:'clamp(40px,5.2vw,66px)', fontWeight:900,
              lineHeight:1.15, marginBottom:18, color:PLUM,
              whiteSpace:'nowrap',
            }}>
              راحتك... <span className="shimmer">ودخلك كمان</span>
            </h1>

            <p style={{ fontSize:16, color:MID, lineHeight:1.85, marginBottom:32, maxWidth:520 }}>
              اكتشفي منتجات Allsence — تقنية Liquid Lock GEL اليابانية المتقدمة، 100% قطن طبيعي، حماية 360° تمنحك ثقة بلا حدود.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center', justifyContent:'center', marginBottom:28 }}>
              <Link to="/products" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:`linear-gradient(135deg,${ROSE},${ROSE_DK})`,
                color:'#fff', borderRadius:50, padding:'14px 34px',
                fontSize:15, fontWeight:800, textDecoration:'none',
                boxShadow:`0 8px 28px rgba(196,113,139,.45)`,
              }}>تسوقي الآن</Link>
              <Link to="/register?type=member" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'rgba(255,255,255,.25)', color:PLUM,
                border:`2px solid ${ROSE}`,
                borderRadius:50, padding:'12px 28px', fontSize:14,
                fontWeight:700, textDecoration:'none', backdropFilter:'blur(10px)',
              }}>انضمي كعضوة واكسبي</Link>
            </div>

            <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center', marginBottom:36 }}>
              {['شحن سريع','100% قطن طبيعي','ضمان الجودة','دفع آمن'].map(b => (
                <div key={b} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:MID }}>
                  <span style={{ color:ROSE, fontWeight:900 }}>✓</span>{b}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:.6 }}
            >
              <span style={{ fontSize:12, color:MID }}>اسكرولي لأسفل</span>
              <div style={{
                width:20, height:32, borderRadius:10,
                border:`2px solid ${ROSE}`, display:'flex', justifyContent:'center', paddingTop:5,
              }}>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width:6, height:6, borderRadius:'50%', background:ROSE }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <Sec style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SecHead title="كيف تشتغل الفكرة؟ 🌸" sub="اشتري منتجات Allsence وشاركيها مع صديقاتك وحصلي على دخل ثاني حقيقي" />
          <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr', gap: 56, alignItems: 'center' }}>
            <motion.div className="hiw-photo" variants={fadeUp} style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=550&fit=crop&crop=top"
                alt="كيف تشتغل"
                style={{ width: '100%', borderRadius: 28, objectFit: 'cover',
                  aspectRatio: '3/4' as unknown as number,
                  boxShadow: '0 20px 60px rgba(196,113,139,.2)' }}
              />
              <div style={{
                position: 'absolute', bottom: 24, right: 24, background: 'white',
                borderRadius: 16, padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: PLUM }}>دخل شهري</div>
                  <div style={{ fontSize: 11, color: MID }}>من 5 مستويات</div>
                </div>
              </div>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { n: 1, t: 'سجلي',             d: 'سجلي حسابك مجاناً في أقل من دقيقة وأصبحي عضوة في مجتمع Allsence — بدون رسوم، بدون تعقيد.', c: `linear-gradient(135deg,${ROSE_DK},${ROSE})` },
                { n: 2, t: 'ادعوي صديقاتك',   d: 'شاركي كود الدعوة الخاص بكِ مع صديقاتك وعائلتك — كل شخص تدعينه يُضاف لشبكتك ويزيد دخلك.', c: `linear-gradient(135deg,${MAUVE},#7a50a8)` },
                { n: 3, t: 'اشتري واربحي',    d: 'اشتري المنتجات واستمتعي بها، وفي نفس الوقت احصلي على عمولة من كل عملية شراء تتم عبر شبكتك من 5 مستويات.', c: 'linear-gradient(135deg,#5ab8b0,#3d8e88)' },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUp} custom={i + 1} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20,
                  background: LT, border: '1px solid rgba(196,113,139,.12)',
                  borderRadius: 20, padding: 24,
                }}>
                  <div className="animate-pulse-glow" style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, color: '#fff', background: s.c,
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: PLUM, marginBottom: 5 }}>{s.t}</div>
                    <div style={{ fontSize: 13, color: MID, lineHeight: 1.65 }}>{s.d}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Sec>

      {/* ── WHY ALLSENCE ──────────────────────────────────────────────── */}
      <Sec style={{ padding: '88px 24px', background: `linear-gradient(180deg,#fff 0%,${LT} 100%)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SecHead title="لماذا Allsence؟" sub="تقنية متقدمة وراحة حقيقية" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
            {([
              { icon: FiShield,  title: 'حماية 360°',      desc: 'تغطية كاملة من كل الاتجاهات طوال اليوم' },
              { icon: FiDroplet, title: 'Liquid Lock GEL',  desc: 'تقنية يابانية متقدمة تحبس السوائل فوراً' },
              { icon: FiStar,    title: '100% قطن',          desc: 'مصنوعة من أجود أنواع القطن الطبيعي' },
              { icon: FiUsers,   title: 'نظام الأعضاء',     desc: 'انضمي واكسبي عمولة من كل عملية بيع' },
            ] as { icon: React.ElementType; title: string; desc: string }[]).map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, boxShadow: `0 16px 48px rgba(196,113,139,.18)` }}
                style={{
                  borderRadius: 24, padding: 28, textAlign: 'center',
                  background: '#fff',
                  border: '1px solid rgba(196,113,139,.12)',
                  boxShadow: '0 4px 20px rgba(196,113,139,.08)',
                  transition: 'box-shadow .3s, transform .3s',
                } as CSSProps}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: `linear-gradient(135deg,${ROSE_DK}18,${ROSE}25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <f.icon size={24} color={ROSE} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: PLUM, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: MID, lineHeight: 1.65 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── PRODUCTS ──────────────────────────────────────────────────── */}
      <Sec style={{ padding: '88px 24px', background: 'linear-gradient(180deg,#fdf8f5 0%,#f5eef8 100%)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <SecHead title="اختاري راحتك ✨" sub="كل منتج مصمم لاحتياج مختلف — ابحثي عن منتجك المثالي" />
          <div className="prods-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
            {products.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
          </div>
          <motion.div variants={fadeUp} custom={5} style={{ textAlign: 'center', marginTop: 44 }}>
            <Link to="/products" style={{
              display: 'inline-flex', alignItems: 'center',
              background: `linear-gradient(135deg,${ROSE_DK},${ROSE})`,
              color: '#fff', borderRadius: 50, padding: '14px 32px',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(196,113,139,.4)',
            }}>تصفح جميع المنتجات</Link>
          </motion.div>
        </div>
      </Sec>

      {/* ── MLM CTA ───────────────────────────────────────────────────── */}
      <Sec style={{ padding: '88px 24px', background: LT }}>
        <motion.div variants={fadeUp} className="mlm-grid" style={{
          maxWidth: 1100, margin: '0 auto', borderRadius: 36, overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr',
        }}>
          <div style={{ background: `linear-gradient(135deg,${ROSE_DK},${MAUVE})`, padding: '64px 48px', color: 'white' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 14px' }}>انضمي كعضوة<br />واكسبي 💜</h2>
            <p style={{ fontSize: 16, opacity: .9, lineHeight: 1.78, marginBottom: 28 }}>
              احصلي على كود إحالة خاص بك وابدئي بكسب عمولة من كل عملية بيع
              تتم عبر شبكتك من <strong>5 مستويات متتالية</strong>. هذا دخل حقيقي مستمر.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}>
              {['كود إحالة خاص','عمولة 5 مستويات','لوحة تحكم','دفع شهري'].map(f => (
                <div key={f} style={{
                  background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
                  borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 700,
                  color: 'white', display: 'flex', alignItems: 'center', gap: 6,
                }}>✓ {f}</div>
              ))}
            </div>
            <Link to="/register?type=member" style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#fff', color: ROSE_DK, borderRadius: 50,
              padding: '11px 26px', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,.1)',
            }}>ابدئي رحلتك الآن ✨</Link>
          </div>
          <div className="mlm-photo" style={{ position: 'relative', overflow: 'hidden', minHeight: 400 }}>
            <img
              src="https://images.unsplash.com/photo-1627163439134-7a8c47e08208?w=600&h=500&fit=crop&crop=top"
              alt="انضمي"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right,rgba(158,77,104,.3),transparent)` }} />
          </div>
        </motion.div>
      </Sec>


    </div>
  );
}

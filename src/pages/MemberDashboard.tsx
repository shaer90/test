import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { networkAPI, ordersAPI, authAPI, Commission, Payment } from '../services/api';
import {
  FiCopy, FiCheck, FiUsers, FiDollarSign, FiShoppingBag,
  FiShare2, FiLink, FiTrendingUp, FiShield, FiSettings,
  FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff, FiLock, FiX,
} from 'react-icons/fi';

interface TeamLevel {
  level: number;
  members: { _id: string; name: string; username: string; createdAt: string }[];
  count: number;
  earnings: number;
}

interface EarningsSummary {
  total: number;
  available: number;
  withdrawn: number;
  levels: { level: number; amount: number; count: number }[];
}

const LEVEL_COLORS = [
  { bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', text: 'text-pink-600', glow: 'rgba(196,113,139,0.15)' },
  { bg: 'from-purple-50 to-violet-100', border: 'border-purple-200', text: 'text-purple-600', glow: 'rgba(147,51,234,0.1)' },
  { bg: 'from-blue-50 to-sky-100', border: 'border-blue-200', text: 'text-blue-600', glow: 'rgba(59,130,246,0.1)' },
  { bg: 'from-teal-50 to-emerald-100', border: 'border-teal-200', text: 'text-teal-600', glow: 'rgba(20,184,166,0.1)' },
  { bg: 'from-orange-50 to-amber-100', border: 'border-orange-200', text: 'text-orange-600', glow: 'rgba(249,115,22,0.1)' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

// Mock earnings history for demo
const COMM_LABEL: Record<string, string> = {
  self: 'ربح من شراءك', level1: 'عمولة مستوى 1', level2: 'عمولة مستوى 2',
  level3: 'عمولة مستوى 3', level4: 'عمولة مستوى 4', level5: 'عمولة مستوى 5',
};

type TabKey = 'earnings' | 'team' | 'orders' | 'verify' | 'settings';

export default function MemberDashboard() {
  const { user, updatePassword } = useAuth();
  const [team, setTeam] = useState<TeamLevel[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('earnings');

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Withdrawal request state
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Toast
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [teamRes, ordersRes, meRes, commRes, payRes] = await Promise.allSettled([
        networkAPI.getMyTeam(),
        ordersAPI.getMyOrders(),
        authAPI.getMe(),
        networkAPI.getMyCommissions(),
        networkAPI.getMyPayments(),
      ]);

      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data?.levels || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data?.orders || []);

      const freshUser = meRes.status === 'fulfilled'
        ? (meRes.value.data as { user?: import('../context/AuthContext').User }).user
        : user;

      const myComm: Commission[] = commRes.status === 'fulfilled' ? commRes.value.data.commissions : [];
      const myPay: Payment[] = payRes.status === 'fulfilled' ? payRes.value.data.payments : [];

      setCommissions(myComm);
      setPayments(myPay);

      const totalPaid = myPay.reduce((s, p) => s + p.amount, 0);
      const commTotal = myComm.reduce((s, c) => s + c.amount, 0);
      const total = freshUser?.totalCommission ?? commTotal;
      const available = freshUser?.availableCommission ?? Math.max(0, commTotal - totalPaid);

      const levelAmounts = [1, 2, 3, 4, 5].map((lvl) => ({
        level: lvl,
        amount: myComm.filter((c) => c.type === `level${lvl}`).reduce((s, c) => s + c.amount, 0),
        count: new Set(myComm.filter((c) => c.type === `level${lvl}`).map((c) => c.fromMemberId)).size,
      }));

      setEarnings({ total, available, withdrawn: totalPaid, levels: levelAmounts });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (user?.subscriberCode) {
      navigator.clipboard.writeText(user.subscriberCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.subscriberCode}&type=member`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    if (amount > (earnings?.available || 0)) {
      showToast('المبلغ أكبر من الرصيد المتاح');
      return;
    }
    showToast(`تم إرسال طلب سحب ₪${amount.toFixed(2)} بنجاح`);
    setWithdrawing(false);
    setWithdrawAmount('');
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'يرجى ملء جميع الحقول' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتان' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await updatePassword(pwForm.current, pwForm.newPw);
      setPwMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ، حاول مجدداً';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setPwLoading(false);
    }
  };

  const totalTeam = team.reduce((s, l) => s + (l.members?.length || 0), 0);

  // Verification status from user
  const verStatus = user?.verificationStatus || 'none';

  if (loading) {
    return (
      <div className="light-page min-h-screen pt-24 flex items-center justify-center" style={{ background: '#fdf8f5' }}>
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              مرحباً، <span className="text-gradient-pink">{user?.name}</span> 👋
            </h1>
            {/* Verification badge */}
            {user?.isVerified ? (
              <span className="flex items-center gap-1 text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2.5 py-1 rounded-full font-semibold">
                <FiShield size={11} /> حساب موثق
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-1 rounded-full font-semibold">
                <FiAlertCircle size={11} />
                {verStatus === 'pending' ? 'قيد المراجعة' : verStatus === 'rejected' ? 'تم الرفض' : 'غير موثق'}
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">لوحة تحكم العضوة</p>
        </motion.div>

        {/* Verification banner (if not verified) */}
        {!user?.isVerified && verStatus === 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 mb-5 border border-yellow-500/20 flex items-center gap-4 flex-wrap"
          >
            <FiShield size={22} className="text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">وثّق حسابك للحصول على مميزات إضافية</div>
              <div className="text-xs text-gray-400">الحسابات الموثقة تحصل على ثقة أكبر وفرص سحب أسرع</div>
            </div>
            <Link to="/verify" className="btn-primary text-sm py-2 px-4 flex-shrink-0 flex items-center gap-1.5">
              توثيق الحساب <FiArrowLeft size={13} />
            </Link>
          </motion.div>
        )}

        {verStatus === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 mb-5 border border-blue-500/20 flex items-center gap-3"
          >
            <FiShield size={18} className="text-blue-400" />
            <div className="text-sm text-blue-300">طلب التوثيق الخاص بك قيد المراجعة من قبل الإدارة</div>
          </motion.div>
        )}

        {verStatus === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 mb-5 border border-red-500/20 flex items-center gap-4 flex-wrap"
          >
            <FiAlertCircle size={18} className="text-red-400" />
            <div className="flex-1 text-sm text-red-300">تم رفض طلب التوثيق. يمكنك إعادة المحاولة</div>
            <Link to="/verify" className="text-sm text-red-400 hover:text-red-300 font-semibold">إعادة التقديم</Link>
          </motion.div>
        )}

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 mb-6 border border-pink-500/20"
          style={{ boxShadow: '0 8px 40px rgba(233,30,140,0.15)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1.5">
                <FiLink size={13} className="text-pink-400" />
                كود الإحالة الخاص بك
              </div>
              <div className="text-3xl font-black text-white tracking-[0.2em] font-mono">
                {user?.subscriberCode || '——'}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 transition-all text-sm font-semibold">
                {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
                {copied ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
              <button onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-semibold">
                {copiedLink ? <FiCheck size={15} /> : <FiShare2 size={15} />}
                {copiedLink ? 'تم النسخ!' : 'رابط الإحالة'}
              </button>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-gray-500 break-all" dir="ltr">
              {window.location.origin}/register?ref={user?.subscriberCode}&type=member
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: FiDollarSign, label: 'الأرباح المتاحة', value: `₪${(earnings?.available || 0).toFixed(2)}`, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', i: 0 },
            { icon: FiTrendingUp, label: 'إجمالي الأرباح', value: `₪${(earnings?.total || 0).toFixed(2)}`, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', i: 1 },
            { icon: FiUsers, label: 'أعضاء الفريق', value: totalTeam.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', i: 2 },
            { icon: FiShoppingBag, label: 'طلباتي', value: orders.length.toString(), color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', i: 3 },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={s.i}
              className={`glass-card rounded-2xl p-5 border ${s.bg}`}
            >
              <div className={`${s.color} mb-3`}><s.icon size={20} /></div>
              <div className={`text-xl md:text-2xl font-black ${s.color} mb-1`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: 'earnings', label: 'الأرباح', icon: FiDollarSign },
            { key: 'team', label: `الفريق (${totalTeam})`, icon: FiUsers },
            { key: 'orders', label: 'طلباتي', icon: FiShoppingBag },
            { key: 'verify', label: 'التوثيق', icon: FiShield },
            { key: 'settings', label: 'الإعدادات', icon: FiSettings },
          ] as { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t.key ? 'bg-pink-600 text-white' : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Earnings Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'earnings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Balance cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'الرصيد المتاح للسحب', value: earnings?.available || 0, color: 'text-green-400', border: 'border-green-500/20', action: true },
                { label: 'إجمالي الأرباح المحققة', value: earnings?.total || 0, color: 'text-pink-400', border: 'border-pink-500/20', action: false },
                { label: 'إجمالي المسحوب', value: earnings?.withdrawn || 0, color: 'text-gray-300', border: 'border-white/10', action: false },
              ].map((b) => (
                <div key={b.label} className={`glass-card rounded-2xl p-5 border ${b.border}`}>
                  <div className="text-xs text-gray-400 mb-2">{b.label}</div>
                  <div className={`text-2xl font-black ${b.color} mb-3`}>₪{b.value.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Level breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">الأرباح حسب المستوى</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((lvl, i) => {
                  const lvlData = earnings?.levels?.find((l) => l.level === lvl);
                  const c = LEVEL_COLORS[i];
                  return (
                    <motion.div
                      key={lvl}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className={`bg-gradient-to-b ${c.bg} border ${c.border} rounded-2xl p-4 text-center`}
                      style={{ boxShadow: `0 4px 20px ${c.glow}` }}
                    >
                      <div className={`text-xs font-bold ${c.text} mb-1`}>المستوى {lvl}</div>
                      <div className={`text-2xl font-black ${c.text} mb-1`}>{lvlData?.count || 0}</div>
                      <div className="text-xs text-gray-500 mb-2">عضو</div>
                      <div className={`text-sm font-bold ${c.text}`}>₪{(lvlData?.amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">أرباح</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Earnings history */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">سجل الأرباح</h3>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {commissions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">لا يوجد أرباح بعد</div>
                  ) : (
                    [...commissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((c) => (
                      <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">{COMM_LABEL[c.type] || c.type}</div>
                          {c.type !== 'self' && c.fromMemberName && (
                            <div className="text-xs text-gray-500 mt-0.5">من: {c.fromMemberName}</div>
                          )}
                          {c.productNames && (
                            <div className="text-xs text-gray-600 mt-0.5 truncate">{c.productNames}</div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm text-green-400">+₪{c.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Payments from admin */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">المدفوعات المستلمة</h3>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {payments.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">لا يوجد مدفوعات بعد</div>
                  ) : (
                    [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map((p) => (
                      <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">دفعة من الإدارة</div>
                          {p.note && <div className="text-xs text-gray-500 mt-0.5">{p.note}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm text-blue-400">₪{p.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{new Date(p.paidAt).toLocaleDateString('ar-EG')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* ── Team Tab ──────────────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {[1, 2, 3, 4, 5].map((lvl, i) => {
              const lvlData = team.find((l) => l.level === lvl);
              const c = LEVEL_COLORS[i];
              return (
                <div key={lvl} className={`glass-card border ${c.border} rounded-2xl overflow-hidden`}>
                  <div className={`px-5 py-3 bg-gradient-to-l ${c.bg} flex items-center justify-between`}>
                    <span className={`font-bold ${c.text}`}>المستوى {lvl}</span>
                    <span className={`text-sm ${c.text}`}>{lvlData?.members?.length || 0} عضو</span>
                  </div>
                  {lvlData && lvlData.members && lvlData.members.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {lvlData.members.slice(0, 5).map((m) => (
                        <div key={m._id} className="px-5 py-3 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${c.bg.replace('from-', 'bg-').split(' ')[0]} flex items-center justify-center text-sm font-bold ${c.text}`}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{m.name}</div>
                            <div className="text-xs text-gray-500">@{m.username}</div>
                          </div>
                          <div className="mr-auto text-xs text-gray-500">
                            {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                      ))}
                      {(lvlData.members?.length || 0) > 5 && (
                        <div className="px-5 py-2 text-xs text-gray-500">
                          و {(lvlData.members?.length || 0) - 5} أعضاء آخرين...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-6 text-center text-sm text-gray-600">
                      لا يوجد أعضاء في هذا المستوى بعد
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Orders Tab ────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {orders.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <FiShoppingBag size={36} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">لا يوجد طلبات بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(orders as Array<{ _id: string; createdAt: string; status: string; cancelledBy?: string; totalPrice: number; items?: Array<{ nameAr: string; quantity: number }> }>).map((o) => (
                  <div key={o._id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">طلب #{o._id.slice(-6)}</div>
                      {o.items && o.items.length > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {o.items.map((i) => `${i.nameAr} ×${i.quantity}`).join(' · ')}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div className="text-pink-400 font-bold">₪{o.totalPrice?.toFixed(2)}</div>
                      <div className={`text-xs mt-0.5 ${o.status === 'delivered' ? 'text-green-400' : o.status === 'pending' ? 'text-yellow-400' : o.status === 'cancelled' ? 'text-red-400' : 'text-gray-400'}`}>
                        {o.status === 'pending' ? 'قيد المعالجة'
                          : o.status === 'delivered' ? 'تم التوصيل'
                          : o.status === 'shipped' ? 'تم الشحن'
                          : o.status === 'cancelled'
                            ? (o.cancelledBy === 'admin' ? 'ملغي من الإدارة' : 'ملغي منك')
                          : o.status}
                      </div>
                    </div>
                    {o.status === 'pending' && (
                      <button
                        onClick={async () => {
                          try {
                            await ordersAPI.cancelOrder((o as { _id: string })._id);
                            setOrders((prev) =>
                              (prev as Array<{ _id: string; status: string }>).map((x) =>
                                x._id === (o as { _id: string })._id ? { ...x, status: 'cancelled', cancelledBy: 'user' } : x
                              )
                            );
                          } catch { /* ignore */ }
                        }}
                        className="w-8 h-8 flex-shrink-0 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        title="إلغاء الطلب"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Verify Tab ────────────────────────────────────────────────────────── */}
        {activeTab === 'verify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card rounded-3xl p-6 max-w-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user?.isVerified ? 'bg-green-400/10' : 'bg-yellow-400/10'}`}>
                  <FiShield size={24} className={user?.isVerified ? 'text-green-400' : 'text-yellow-400'} />
                </div>
                <div>
                  <h3 className="font-bold text-white">توثيق الحساب</h3>
                  <p className="text-xs text-gray-400">اثبت هويتك لتحصل على مميزات إضافية</p>
                </div>
              </div>

              {/* Status */}
              <div className={`rounded-2xl p-4 mb-5 text-sm ${
                user?.isVerified ? 'bg-green-400/10 border border-green-400/20 text-green-300' :
                verStatus === 'pending' ? 'bg-blue-400/10 border border-blue-400/20 text-blue-300' :
                verStatus === 'rejected' ? 'bg-red-400/10 border border-red-400/20 text-red-300' :
                'bg-white/5 border border-white/10 text-gray-400'
              }`}>
                {user?.isVerified
                  ? '✓ حسابك موثق بنجاح'
                  : verStatus === 'pending'
                  ? '⏳ طلبك قيد المراجعة من قبل الإدارة، سيتم الرد خلال 24-48 ساعة'
                  : verStatus === 'rejected'
                  ? '✗ تم رفض طلب التوثيق، يمكنك إعادة التقديم'
                  : 'لم تقم بتوثيق حسابك بعد'}
              </div>

              {/* Verified benefits */}
              <div className="space-y-2 mb-6">
                {[
                  'سحب الأرباح بشكل أسرع وبدون قيود',
                  'شارة "موثق" تظهر على حسابك',
                  'مصداقية أعلى مع أعضاء فريقك',
                  'دعم أولوي من الفريق',
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <FiCheck size={13} className="text-green-400 flex-shrink-0" />
                    {b}
                  </div>
                ))}
              </div>

              {!user?.isVerified && verStatus !== 'pending' && (
                <Link to="/verify" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  <FiShield size={16} />
                  {verStatus === 'rejected' ? 'إعادة تقديم طلب التوثيق' : 'تقديم طلب التوثيق'}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Settings Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-lg">

            {/* Profile Info */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <FiSettings size={16} className="text-pink-400" /> معلومات الحساب
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'الاسم', value: user?.name },
                  { label: 'اسم المستخدم', value: `@${user?.username}` },
                  { label: 'رقم الهاتف', value: user?.phone },
                  { label: 'الدولة', value: user?.country || '—' },
                  { label: 'المدينة', value: user?.city || '—' },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-gray-400">{f.label}</span>
                    <span className="text-white font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <FiLock size={16} className="text-pink-400" /> تغيير كلمة المرور
              </h3>

              <AnimatePresence>
                {pwMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 text-sm rounded-xl px-4 py-2.5 ${
                      pwMsg.type === 'success'
                        ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                    }`}
                  >
                    {pwMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {([
                  { key: 'current', label: 'كلمة المرور الحالية' },
                  { key: 'newPw', label: 'كلمة المرور الجديدة' },
                  { key: 'confirm', label: 'تأكيد كلمة المرور الجديدة' },
                ] as { key: keyof typeof pwForm; label: string }[]).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                    <div className="relative">
                      <input
                        type={showPw[f.key] ? 'text' : 'password'}
                        value={pwForm[f.key]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="input-field w-full pl-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => ({ ...s, [f.key]: !s[f.key] }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPw[f.key] ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                className="btn-primary w-full mt-5 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {pwLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiLock size={15} />
                )}
                {pwLoading ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Withdrawal modal */}
      <AnimatePresence>
        {withdrawing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-white mb-1">طلب سحب الأرباح</h3>
              <p className="text-sm text-gray-400 mb-4">الرصيد المتاح: <span className="text-green-400 font-bold">₪{(earnings?.available || 0).toFixed(2)}</span></p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">المبلغ المراد سحبه (₪)</label>
                <input
                  type="number"
                  min={1}
                  max={earnings?.available || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-field w-full"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={handleWithdraw} className="btn-primary flex-1 py-3">تأكيد الطلب</button>
                <button onClick={() => { setWithdrawing(false); setWithdrawAmount(''); }}
                  className="glass-card flex-1 py-3 text-gray-300 hover:text-white rounded-2xl font-semibold text-sm">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2"
          >
            <FiCheck className="text-green-400" size={15} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

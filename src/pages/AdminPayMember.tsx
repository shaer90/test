import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../services/api';
import type { StoredMember } from '../services/api';
import {
  FiSearch, FiDollarSign, FiCheck, FiArrowLeft,
  FiUser, FiX, FiAlertCircle,
} from 'react-icons/fi';

export default function AdminPayMember() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoredMember[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<StoredMember | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ name: string; amount: number } | null>(null);
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  const doSearch = async (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { setResults([]); setSearched(false); return; }
    const res = await adminAPI.getMembers();
    const all: StoredMember[] = res.data.members as StoredMember[];
    const found = all.filter(
      (m) =>
        (m.role === 'member' || m.role === 'admin' || m.role === 'super_admin') &&
        (m.name.toLowerCase().includes(trimmed) ||
          m.username.toLowerCase().includes(trimmed) ||
          (m.subscriberCode || '').toLowerCase().includes(trimmed))
    );
    setResults(found);
    setSearched(true);
    setSelected(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectMember = (m: StoredMember) => {
    setSelected(m);
    setAmount('');
    setNote('');
    setError('');
    setTimeout(() => amountRef.current?.focus(), 80);
  };

  const handlePay = async () => {
    const amt = parseFloat(amount);
    if (!selected) return;
    if (!amt || amt <= 0) { setError('أدخل مبلغاً صحيحاً'); return; }
    setError('');
    setPaying(true);
    try {
      await adminAPI.payMember(selected._id, amt, note.trim() || undefined);
      setSuccess({ name: selected.name, amount: amt });
      setSelected(null);
      setAmount('');
      setNote('');
      setQuery('');
      setResults([]);
      setSearched(false);
    } catch {
      setError('حدث خطأ، حاول مجدداً');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft size={14} /> العودة للوحة التحكم
          </Link>
          <h1 className="text-2xl font-black text-white">دفع للأعضاء</h1>
          <p className="text-gray-400 text-sm mt-1">ابحث عن عضو وادفع له مبلغاً مالياً</p>
        </motion.div>

        {/* Success toast */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4"
            >
              <FiCheck size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-green-300">
                  تم الدفع بنجاح لـ {success.name}
                </div>
                <div className="text-xs text-green-400/70 mt-0.5">المبلغ: ₪{success.amount.toFixed(2)}</div>
              </div>
              <button onClick={() => setSuccess(null)} className="mr-auto text-green-400/60 hover:text-green-400">
                <FiX size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-3xl p-6 mb-5"
        >
          <label className="text-xs text-gray-400 mb-2 block">ابحث بالاسم أو اسم المستخدم أو كود الإحالة</label>
          <div className="relative">
            <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field w-full pr-9"
              placeholder="مثال: سارة أو SR123456"
              dir="auto"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Search results */}
        <AnimatePresence>
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-3xl overflow-hidden mb-5"
            >
              {results.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                  <FiAlertCircle size={22} className="text-gray-600" />
                  لا يوجد أعضاء مطابقون
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {results.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => selectMember(m)}
                      className={`w-full px-5 py-4 flex items-center gap-4 text-right transition-colors hover:bg-white/5 ${
                        selected?._id === m._id ? 'bg-pink-500/10' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
                        <FiUser size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{m.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">@{m.username} · {m.subscriberCode || '—'}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500">الرصيد المتاح</div>
                        <div className="text-sm font-bold text-green-400">
                          ₪{(m.availableCommission || 0).toFixed(2)}
                        </div>
                      </div>
                      {selected?._id === m._id && (
                        <FiCheck size={15} className="text-pink-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay form */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="glass-card rounded-3xl p-6 border border-pink-500/20"
              style={{ boxShadow: '0 8px 40px rgba(233,30,140,0.1)' }}
            >
              {/* Selected member summary */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/5">
                <div className="w-11 h-11 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <FiUser size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-white">{selected.name}</div>
                  <div className="text-xs text-gray-500">@{selected.username} · {selected.subscriberCode || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">الرصيد المتاح</div>
                  <div className="text-lg font-black text-green-400">₪{(selected.availableCommission || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">المبلغ (₪) *</label>
                  <div className="relative">
                    <FiDollarSign size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      ref={amountRef}
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setError(''); }}
                      className="input-field w-full pr-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field w-full"
                    placeholder="مثال: دفعة شهر أبريل"
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5"
                    >
                      <FiAlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {paying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiDollarSign size={15} />
                    )}
                    {paying ? 'جارٍ الدفع...' : 'تأكيد الدفع'}
                  </button>
                  <button
                    onClick={() => { setSelected(null); setAmount(''); setNote(''); setError(''); }}
                    className="glass-card px-5 py-3 rounded-2xl text-gray-400 hover:text-white text-sm font-semibold transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

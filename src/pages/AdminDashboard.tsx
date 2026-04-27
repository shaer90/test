import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI, authAPI, productsAPI, PaymentRequest } from '../services/api';
import { Product } from '../data/products';
import CountrySelect from '../components/CountrySelect';
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiSettings,
  FiCheck, FiPackage, FiTrendingUp, FiSave, FiPlus, FiEdit2,
  FiTrash2, FiX, FiShield, FiAlertCircle, FiEye, FiCamera,
  FiLock, FiEyeOff, FiChevronDown, FiBell, FiSearch,
} from 'react-icons/fi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommissionRates {
  memberSelf: number;
  level1: number; level2: number; level3: number; level4: number; level5: number;
}

interface Member {
  _id: string; name: string; username: string; phone: string;
  role: string; subscriberCode?: string; createdAt: string;
  availableCommission?: number; totalCommission?: number;
  isVerified?: boolean; verificationStatus?: string;
  country?: string; city?: string; ageGroup?: string; isActive?: boolean;
}

interface Order {
  _id: string; createdAt: string; status: string;
  totalPrice: number;
  user?: { name: string; phone: string; id: string };
  items?: Array<{ id: string; name: string; nameAr: string; price: number; quantity: number; color: string }>;
  address?: string; paymentMethod?: string; notes?: string;
  cancelledBy?: 'user' | 'admin';
}

interface Stats {
  totalMembers: number; totalCustomers: number;
  totalOrders: number; totalRevenue: number;
}

interface Verification {
  id: string; userId: string; userName: string; userCode?: string;
  idType: string; idNumber: string; fullName: string; dateOfBirth: string; phone?: string;
  idImage?: string; status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; rejectionReason?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد المعالجة', color: 'text-yellow-400 bg-yellow-400/10' },
  processing: { label: 'يُعالج', color: 'text-blue-400 bg-blue-400/10' },
  shipped: { label: 'شُحن', color: 'text-purple-400 bg-purple-400/10' },
  delivered: { label: 'تم التوصيل', color: 'text-green-400 bg-green-400/10' },
  cancelled: { label: 'ملغي', color: 'text-red-400 bg-red-400/10' },
};

const LEVEL_COLORS = ['text-pink-400', 'text-purple-400', 'text-blue-400', 'text-teal-400', 'text-orange-400'];

type TabKey = 'stats' | 'products' | 'verifications' | 'members' | 'orders' | 'commissions' | 'payment-requests';

// ── Derive dark bg gradient from a primary color ─────────────────────────────
function colorToBg(hex: string): [string, string] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return ['#1a0010', '#2d0020'];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const h = (n: number) => Math.max(0, Math.round(n)).toString(16).padStart(2, '0');
  return [`#${h(r * 0.1)}${h(g * 0.1)}${h(b * 0.1)}`, `#${h(r * 0.18)}${h(g * 0.18)}${h(b * 0.18)}`];
}

// ── Product Form Modal ─────────────────────────────────────────────────────────

interface ProductFormProps {
  product: Partial<Product> | null;
  onSave: (p: Product) => void;
  onClose: () => void;
}

function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const imgRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Product>>(
    product ?? {
      id: '', name: '', nameAr: '', price: 0, count: 1,
      color: '#E91E8C', colorDark: '#880E4F',
      bg: ['#1a0010', '#2d0020'], badge: '',
      features: [], desc: '', longDesc: '', specs: [], image: undefined,
    }
  );
  const [featuresText, setFeaturesText] = useState((product?.features ?? []).join('\n'));
  const [err, setErr] = useState('');

  const set = (k: keyof Product, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('حجم الصورة يجب أن يكون أقل من 5MB'); return; }
    if (!file.type.startsWith('image/')) { setErr('يرجى رفع صورة فقط (JPG, PNG, WebP)'); return; }
    // Validate magic bytes to ensure the file is actually an image
    const headerReader = new FileReader();
    headerReader.onload = (ev) => {
      const arr = new Uint8Array(ev.target?.result as ArrayBuffer).slice(0, 4);
      const isJpeg = arr[0] === 0xFF && arr[1] === 0xD8;
      const isPng  = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
      const isWebp = arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46;
      const isGif  = arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38;
      if (!isJpeg && !isPng && !isWebp && !isGif) {
        setErr('نوع الملف غير صالح. يُسمح فقط بـ JPG و PNG و WebP و GIF');
        return;
      }
      const dr = new FileReader();
      dr.onloadend = () => set('image', dr.result as string);
      dr.readAsDataURL(file);
    };
    headerReader.readAsArrayBuffer(file.slice(0, 4));
    e.target.value = '';
  };

  const handleSave = () => {
    if (!form.nameAr) return setErr('الاسم بالعربية مطلوب');
    if (!form.price || form.price <= 0) return setErr('السعر يجب أن يكون أكبر من صفر');
    const features = featuresText.split('\n').map((s) => s.trim()).filter(Boolean);
    const id = form.id || `product-${Date.now()}`;
    const full: Product = {
      id,
      name: form.name || '',
      nameAr: form.nameAr || '',
      price: Number(form.price),
      count: Number(form.count) || 1,
      color: form.color || '#E91E8C',
      colorDark: form.colorDark || '#880E4F',
      bg: form.bg || ['#1a0010', '#2d0020'],
      badge: form.badge || '',
      features,
      desc: form.desc || '',
      longDesc: form.longDesc || '',
      specs: form.specs || [],
      image: form.image,
    };
    onSave(full);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">
            {product?.id ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        {err && <div className="mb-4 text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2">{err}</div>}

        <div className="space-y-4">

          {/* ── Product Image Upload ── */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">صورة المنتج</label>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              type="button"
              onClick={() => imgRef.current?.click()}
              className={`w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                form.image ? 'border-pink-500/40 p-2' : 'border-white/10 hover:border-pink-500/30 p-6'
              }`}
            >
              {form.image ? (
                <div className="relative">
                  <img
                    src={form.image}
                    alt="product"
                    className="w-full h-40 object-contain rounded-xl"
                    style={{ filter: `drop-shadow(0 8px 24px ${form.color || '#E91E8C'}66)` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                    <div className="flex items-center gap-2 text-white text-sm font-semibold bg-pink-600 px-4 py-2 rounded-xl">
                      <FiCamera size={14} /> تغيير الصورة
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                    <FiCamera size={24} className="text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400 font-medium">انقر لرفع صورة المنتج</div>
                  <div className="text-xs">PNG, JPG, WebP — حجم أقصى 5MB</div>
                  <div className="text-xs text-gray-600">ستظهر في الصفحة الرئيسية وصفحة المنتج</div>
                </div>
              )}
            </button>
            {form.image && (
              <button
                type="button"
                onClick={() => set('image', undefined)}
                className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <FiX size={11} /> إزالة الصورة (العودة للرسم الافتراضي)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الاسم بالعربية *</label>
              <input value={form.nameAr || ''} onChange={(e) => set('nameAr', e.target.value)}
                className="input-field w-full" placeholder="فوط يومية" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الاسم بالإنجليزية</label>
              <input value={form.name || ''} onChange={(e) => set('name', e.target.value)}
                className="input-field w-full" placeholder="Daily Pads" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">السعر (₪) *</label>
              <input type="number" min={0} step={0.01} value={form.price || ''} onChange={(e) => set('price', e.target.value)}
                className="input-field w-full" placeholder="12.99" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الكمية بالعبوة</label>
              <input type="number" min={1} value={form.count || ''} onChange={(e) => set('count', e.target.value)}
                className="input-field w-full" placeholder="60" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">اللون</label>
              {/* Live background preview */}
              <div
                className="w-full h-14 rounded-xl mb-2 flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${form.bg?.[0] || '#1a0010'}, ${form.bg?.[1] || '#2d0020'})` }}
              >
                <div className="absolute inset-0"
                  style={{ background: `radial-gradient(circle at 60% 50%, ${form.color || '#E91E8C'}40, transparent 65%)` }} />
                <span className="relative z-10 font-bold text-sm" style={{ color: form.color || '#E91E8C' }}>
                  {form.nameAr || form.name || 'معاينة'}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.color || '#E91E8C'}
                  onChange={(e) => {
                    const c = e.target.value;
                    setForm((f) => ({ ...f, color: c, bg: colorToBg(c) }));
                  }}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input value={form.color || '#E91E8C'}
                  onChange={(e) => {
                    const c = e.target.value;
                    setForm((f) => ({ ...f, color: c, ...(/^#[0-9a-fA-F]{6}$/.test(c) ? { bg: colorToBg(c) } : {}) }));
                  }}
                  className="input-field flex-1 text-xs" placeholder="#E91E8C" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">الشارة (badge)</label>
            <input value={form.badge || ''} onChange={(e) => set('badge', e.target.value)}
              className="input-field w-full" placeholder="الأكثر مبيعاً" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">الوصف القصير</label>
            <input value={form.desc || ''} onChange={(e) => set('desc', e.target.value)}
              className="input-field w-full" placeholder="وصف مختصر للمنتج..." />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">الوصف التفصيلي</label>
            <textarea value={form.longDesc || ''} onChange={(e) => set('longDesc', e.target.value)}
              rows={3} className="input-field w-full resize-none" placeholder="وصف مفصل للمنتج..." />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">المميزات (كل ميزة في سطر)</label>
            <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)}
              rows={4} className="input-field w-full resize-none"
              placeholder={'ناعمة على البشرة\n100% قطن طبيعي\nحماية فائقة'} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <FiSave size={15} /> حفظ
          </button>
          <button onClick={onClose}
            className="glass-card flex-1 py-3 text-gray-300 hover:text-white rounded-2xl font-semibold text-sm">
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Custom Role Selector ──────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'customer', label: 'زبون', color: 'text-gray-300' },
  { value: 'member', label: 'عضو', color: 'text-blue-400' },
  { value: 'admin', label: 'مدير', color: 'text-purple-400' },
  { value: 'super_admin', label: 'مدير عام', color: 'text-pink-400' },
];

function RoleSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = ROLE_OPTIONS.find((r) => r.value === value) || ROLE_OPTIONS[0];

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Render dropdown via portal to escape transforms/overflow on modal ancestors
  const dropdown = open ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
      }}
      className="bg-gray-900 border border-white/20 rounded-xl py-1 shadow-2xl"
    >
      {ROLE_OPTIONS.map((r) => (
        <button
          key={r.value}
          type="button"
          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
          onClick={() => { onChange(r.value); setOpen(false); }}
          className={`w-full text-right px-4 py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors flex items-center justify-between ${r.color}`}
        >
          {r.label}
          {value === r.value && <FiCheck size={13} />}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="input-field w-full flex items-center justify-between gap-2"
      >
        <span className={selected.color + ' font-semibold'}>{selected.label}</span>
        <FiChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </div>
  );
}

// ── Member Edit Modal ──────────────────────────────────────────────────────────

interface MemberEditProps {
  member: Member;
  onSave: (id: string, data: Partial<Member>) => void;
  onClose: () => void;
}

function MemberEditModal({ member, onSave, onClose }: MemberEditProps) {
  const sponsorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone,
    role: member.role,
    country: member.country || '',
    city: member.city || '',
    subscriberCode: member.subscriberCode || '',
    sponsorCode: (member as Member & { sponsorCode?: string }).sponsorCode || '',
    availableCommission: String(member.availableCommission ?? ''),
    totalCommission: String(member.totalCommission ?? ''),
    isVerified: member.isVerified ?? false,
  });

  const [sponsorInfo, setSponsorInfo] = useState<{ name: string } | null>(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [activeSection, setActiveSection] = useState<'info' | 'finance' | 'password'>('info');

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // Initial lookup for existing sponsor code
  useEffect(() => {
    const code = form.sponsorCode.trim();
    if (code.length >= 4) {
      setSponsorLoading(true);
      authAPI.checkReferral(code).then((res) => {
        if (res.data.valid) setSponsorInfo(res.data.sponsor);
      }).catch(() => {}).finally(() => setSponsorLoading(false));
    }
  }, []);

  const handleSponsorChange = (code: string) => {
    set('sponsorCode', code);
    setSponsorInfo(null);
    if (sponsorTimer.current) clearTimeout(sponsorTimer.current);
    if (code.length >= 4) {
      setSponsorLoading(true);
      sponsorTimer.current = setTimeout(async () => {
        try {
          const res = await authAPI.checkReferral(code);
          setSponsorInfo(res.data.valid ? res.data.sponsor : null);
        } catch { setSponsorInfo(null); }
        finally { setSponsorLoading(false); }
      }, 600);
    } else {
      setSponsorLoading(false);
    }
  };

  const handleSave = () => {
    const data: Partial<Member> & { sponsorCode?: string } = {
      name: form.name,
      phone: form.phone,
      role: form.role,
      country: form.country || undefined,
      city: form.city || undefined,
      isVerified: form.isVerified,
      verificationStatus: form.isVerified ? 'approved' : (member.verificationStatus === 'approved' ? 'none' : member.verificationStatus),
    };
    if (form.subscriberCode) data.subscriberCode = form.subscriberCode;
    if (form.sponsorCode !== undefined) data.sponsorCode = form.sponsorCode || '';
    if (form.availableCommission !== '') data.availableCommission = parseFloat(form.availableCommission);
    if (form.totalCommission !== '') data.totalCommission = parseFloat(form.totalCommission);
    onSave(member._id, data);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setPwMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setPwMsg('كلمتا المرور غير متطابقتان'); return; }
    try {
      await adminAPI.resetPassword(member._id, newPassword);
      setPwMsg('✓ تم تعيين كلمة المرور الجديدة');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch {
      setPwMsg('حدث خطأ أثناء تعيين كلمة المرور');
    }
  };

  const sections = [
    { key: 'info', label: 'البيانات الأساسية' },
    { key: 'finance', label: 'المالية والكود' },
    { key: 'password', label: 'كلمة المرور' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">تعديل بيانات العضو</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><FiX size={20} /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Member identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-black">{member.name.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold text-white">{form.name}</div>
              <div className="text-xs text-gray-500">@{member.username}</div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSection === s.key ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Section: Basic Info */}
          {activeSection === 'info' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">الاسم الكامل</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">رقم الهاتف</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input-field w-full font-mono" dir="ltr" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الدولة</label>
                  <input value={form.country} onChange={(e) => set('country', e.target.value)} className="input-field w-full" placeholder="فلسطين" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">المدينة</label>
                  <input value={form.city} onChange={(e) => set('city', e.target.value)} className="input-field w-full" placeholder="رام الله" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">الدور</label>
                <RoleSelector value={form.role} onChange={(v) => set('role', v)} />
              </div>
            </div>
          )}

          {/* Section: Finance */}
          {activeSection === 'finance' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">كود الإحالة الخاص به</label>
                <input value={form.subscriberCode} onChange={(e) => set('subscriberCode', e.target.value.toUpperCase())}
                  className="input-field w-full font-mono tracking-widest" placeholder="SR000000" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">كود المُحيل (من أضافه)</label>
                <input
                  value={form.sponsorCode}
                  onChange={(e) => handleSponsorChange(e.target.value.toUpperCase())}
                  className="input-field w-full font-mono tracking-widest"
                  placeholder="SR000000"
                  dir="ltr"
                />
                {sponsorLoading && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    جارٍ البحث...
                  </div>
                )}
                {!sponsorLoading && sponsorInfo && (
                  <div className="mt-1.5 text-xs text-green-400 flex items-center gap-1.5">
                    <FiCheck size={11} /> {sponsorInfo.name}
                  </div>
                )}
                {!sponsorLoading && !sponsorInfo && form.sponsorCode.length >= 4 && (
                  <div className="mt-1.5 text-xs text-red-400">كود غير موجود</div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">الرصيد المتاح (₪)</label>
                <input type="number" min={0} step={0.01} value={form.availableCommission}
                  onChange={(e) => set('availableCommission', e.target.value)}
                  className="input-field w-full" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">إجمالي الأرباح المحققة (₪)</label>
                <input type="number" min={0} step={0.01} value={form.totalCommission}
                  onChange={(e) => set('totalCommission', e.target.value)}
                  className="input-field w-full" placeholder="0.00" />
              </div>
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 text-xs text-yellow-400">
                تعديل الأرقام المالية يؤثر مباشرة على رصيد العضو
              </div>
            </div>
          )}

          {/* Section: Password */}
          {activeSection === 'password' && (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-400">
                يمكنك تعيين كلمة مرور جديدة للعضو. ستحتاج لإبلاغه بها.
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field w-full pl-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field w-full pl-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPw((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showConfirmPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>
              {pwMsg && (
                <div className={`text-xs rounded-xl px-3 py-2 ${pwMsg.startsWith('✓') ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                  {pwMsg}
                </div>
              )}
              <button
                onClick={handleResetPassword}
                className="w-full py-3 flex items-center justify-center gap-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 rounded-2xl font-semibold text-sm transition-colors"
              >
                <FiLock size={14} /> تعيين كلمة المرور
              </button>
            </div>
          )}

        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <FiSave size={15} /> حفظ التعديلات
          </button>
          <button onClick={onClose}
            className="glass-card flex-1 py-3 text-gray-300 hover:text-white rounded-2xl font-semibold text-sm">
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Verification Image Modal ───────────────────────────────────────────────────

function VerificationImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 left-0 text-white text-sm flex items-center gap-1">
          <FiX size={16} /> إغلاق
        </button>
        <img src={src} alt="ID" className="w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ── Add Member Modal ───────────────────────────────────────────────────────────

function AddMemberModal({ onClose, onAdded }: { onClose: () => void; onAdded: (m: Member) => void }) {
  const [form, setForm] = useState({
    name: '', username: '', phone: '', password: '', role: 'member' as 'member' | 'customer',
    sponsorCode: '', country: '', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.phone || !form.password) {
      setError('يرجى ملء جميع الحقول الإلزامية'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name, username: form.username, phone: form.phone,
        password: form.password, role: form.role,
        sponsorCode: form.sponsorCode.trim() || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
      });
      onAdded(res.data.user as unknown as Member);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-3xl p-6 w-full max-w-md border border-white/20 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FiPlus size={16} className="text-pink-400" /> إضافة عضو / زبون
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
            <FiAlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Role toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-1">
            {(['member', 'customer'] as const).map((r) => (
              <button key={r} type="button" onClick={() => set('role', r)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${form.role === r ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {r === 'member' ? 'عضو' : 'زبون'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الاسم *</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field w-full" placeholder="الاسم الكامل" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">اسم المستخدم *</label>
              <input type="text" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))} className="input-field w-full" placeholder="username" dir="ltr" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">رقم الهاتف *</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input-field w-full" placeholder="+970..." dir="ltr" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">كلمة المرور *</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="input-field w-full" placeholder="••••••••" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">كود المُحيل (اختياري)</label>
            <input type="text" value={form.sponsorCode} onChange={(e) => set('sponsorCode', e.target.value.toUpperCase())} className="input-field w-full" placeholder="مثال: SR123456" dir="ltr" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الدولة</label>
              <CountrySelect value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">المدينة</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className="input-field w-full" placeholder="رام الله" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck size={15} />}
              {loading ? 'جارٍ الإضافة...' : 'إضافة'}
            </button>
            <button type="button" onClick={onClose} className="glass-card px-5 py-3 rounded-2xl text-gray-400 hover:text-white font-semibold text-sm transition-colors">إلغاء</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rates, setRates] = useState<CommissionRates>({ memberSelf: 0, level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 });
  const [ratesSaved, setRatesSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productModal, setProductModal] = useState<{ open: boolean; product: Partial<Product> | null }>({ open: false, product: null });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Verifications state
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Payment requests
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  // Members search/filter
  const [memberSearch, setMemberSearch] = useState('');
  const [memberActiveFilter, setMemberActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Member edit / add
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'verifications') fetchVerifications();
  }, [activeTab]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ratesRes, membersRes, payReqRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getCommissionRates(),
        adminAPI.getMembers(),
        adminAPI.getPaymentRequests(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (ratesRes.status === 'fulfilled') setRates(ratesRes.value.data?.rates || rates);
      if (membersRes.status === 'fulfilled') setMembers((membersRes.value.data?.members || []) as Member[]);
      if (payReqRes.status === 'fulfilled') setPaymentRequests(payReqRes.value.data?.requests || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await adminAPI.getMembers();
      setMembers((res.data?.members || []) as Member[]);
    } catch { /* ignore */ }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminAPI.getOrders();
      setOrders(res.data?.orders || []);
    } catch { /* ignore */ }
  };

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts((res.data as { products?: Product[] })?.products || []);
    } catch { /* ignore */ }
  };

  const fetchVerifications = async () => {
    try {
      const res = await adminAPI.getVerifications();
      setVerifications((res.data as { verifications?: Verification[] })?.verifications || []);
    } catch { /* ignore */ }
  };

  const saveRates = async () => {
    await adminAPI.updateCommissionRates(rates);
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2500);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(id, status);
    } catch { /* ignore */ }
    setOrders((prev) => prev.map((o) => {
      if (o._id !== id) return o;
      const extra = status === 'cancelled' ? { cancelledBy: 'admin' as const } : { cancelledBy: undefined };
      return { ...o, status, ...extra };
    }));
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────

  const handleSaveProduct = async (p: Product) => {
    const existing = products.find((x) => x.id === p.id);
    try {
      if (existing) {
        // Pass image as null (not undefined) so JSON includes it and the server clears it
        await adminAPI.updateProduct(p.id, { ...p, image: p.image ?? null });
        setProducts((prev) => prev.map((x) => x.id === p.id ? p : x));
        showToast('تم تعديل المنتج بنجاح');
      } else {
        await adminAPI.createProduct(p);
        setProducts((prev) => [...prev, p]);
        showToast('تم إضافة المنتج بنجاح');
      }
    } catch {
      showToast('حدث خطأ أثناء حفظ المنتج');
    }
    setProductModal({ open: false, product: null });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await adminAPI.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('تم حذف المنتج');
    } catch {
      showToast('حدث خطأ أثناء حذف المنتج');
    }
    setDeleteConfirm(null);
  };

  // ── Member Edit ───────────────────────────────────────────────────────────

  const handleSaveMember = async (id: string, data: Partial<Member>) => {
    try {
      await adminAPI.updateMember(id, data as Parameters<typeof adminAPI.updateMember>[1]);
      setMembers((prev) => prev.map((m) => m._id === id ? { ...m, ...data } : m));
      showToast('تم تعديل بيانات العضو');
    } catch {
      showToast('حدث خطأ أثناء حفظ البيانات');
    }
    setEditMember(null);
  };

  const handleApproveVerification = async (ver: Verification) => {
    try {
      await adminAPI.approveVerification(ver.id);
      setVerifications((prev) => prev.map((v) => v.id === ver.id ? { ...v, status: 'approved' as const } : v));
      setMembers((prev) => prev.map((m) => m._id === ver.userId ? { ...m, isVerified: true, verificationStatus: 'approved' } : m));
      showToast('تم قبول التوثيق ✓');
    } catch {
      showToast('حدث خطأ');
    }
  };

  const handleRejectVerification = async (ver: Verification) => {
    try {
      await adminAPI.rejectVerification(ver.id);
      setVerifications((prev) => prev.map((v) => v.id === ver.id ? { ...v, status: 'rejected' as const } : v));
      setMembers((prev) => prev.map((m) => m._id === ver.userId ? { ...m, isVerified: false, verificationStatus: 'rejected' } : m));
      showToast('تم رفض التوثيق');
    } catch {
      showToast('حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="light-page min-h-screen pt-24 flex items-center justify-center" style={{ background: '#fdf8f5' }}>
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white">
            لوحة <span className="text-gradient-pink">الإدارة</span>
          </h1>
          <p className="text-gray-400 mt-1">إدارة المنتجات والأعضاء والعمولات</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: 'stats',            label: 'الإحصائيات',   icon: FiTrendingUp },
            { key: 'products',         label: 'المنتجات',     icon: FiPackage },
            { key: 'verifications',    label: 'التوثيقات',    icon: FiShield },
            { key: 'members',          label: 'الأعضاء',      icon: FiUsers },
            { key: 'orders',           label: 'الطلبات',      icon: FiShoppingBag },
            { key: 'commissions',      label: 'العمولات',     icon: FiSettings },
            { key: 'payment-requests', label: 'طلبات الدفع',  icon: FiBell },
          ] as { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-pink-600 text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              <t.icon size={15} />
              {t.label}
              {t.key === 'verifications' && verifications.filter((v) => v.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center">
                  {verifications.filter((v) => v.status === 'pending').length}
                </span>
              )}
              {t.key === 'payment-requests' && paymentRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-orange-400 text-black text-xs font-bold flex items-center justify-center">
                  {paymentRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Main stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FiUsers, label: 'الأعضاء', value: stats?.totalMembers || 0, color: 'text-pink-400', bg: 'border-pink-500/20' },
                { icon: FiUsers, label: 'الزبائن', value: stats?.totalCustomers || 0, color: 'text-purple-400', bg: 'border-purple-500/20' },
                { icon: FiPackage, label: 'الطلبات', value: stats?.totalOrders || 0, color: 'text-blue-400', bg: 'border-blue-500/20' },
                { icon: FiDollarSign, label: 'الإيرادات', value: `₪${(stats?.totalRevenue || 0).toFixed(0)}`, color: 'text-green-400', bg: 'border-green-500/20' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass-card rounded-2xl p-5 border ${s.bg}`}
                >
                  <s.icon className={`${s.color} mb-3`} size={20} />
                  <div className={`text-2xl font-black ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Age group stats */}
            {(() => {
              const AGE_GROUPS = ['15-20', '21-30', '31-40', '41-50', '51+'];
              const AGE_COLORS = [
                { text: 'text-pink-400', border: 'border-pink-500/20', bar: '#E91E8C' },
                { text: 'text-purple-400', border: 'border-purple-500/20', bar: '#9C27B0' },
                { text: 'text-blue-400', border: 'border-blue-500/20', bar: '#2196F3' },
                { text: 'text-teal-400', border: 'border-teal-500/20', bar: '#009688' },
                { text: 'text-orange-400', border: 'border-orange-500/20', bar: '#FF6D00' },
              ];
              const counts = AGE_GROUPS.map((g) =>
                members.filter((m) => m.ageGroup === g).length
              );
              const maxCount = Math.max(...counts, 1);
              return (
                <div className="glass-card rounded-2xl p-5 border border-white/10">
                  <div className="text-sm font-bold text-white mb-4">توزيع الفئات العمرية</div>
                  <div className="grid grid-cols-5 gap-3">
                    {AGE_GROUPS.map((g, i) => (
                      <motion.div
                        key={g}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`glass-card rounded-xl p-4 border ${AGE_COLORS[i].border} text-center`}
                      >
                        <div className={`text-2xl font-black ${AGE_COLORS[i].text} mb-1`}>{counts[i]}</div>
                        <div className="text-xs text-gray-400 mb-2">{g}</div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(counts[i] / maxCount) * 100}%` }}
                            transition={{ delay: i * 0.07 + 0.2, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: AGE_COLORS[i].bar }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    إجمالي المسجلين مع فئة عمرية: {counts.reduce((a, b) => a + b, 0)} من {members.length}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ── Products ───────────────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{products.length} منتج</h2>
              <button
                onClick={() => setProductModal({ open: true, product: null })}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <FiPlus size={15} /> إضافة منتج
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-4 border"
                  style={{ borderColor: `${p.color}30` }}
                >
                  {/* Product image preview */}
                  {p.image && (
                    <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-white/5 flex items-center justify-center">
                      <img src={p.image} alt={p.nameAr} className="h-full w-full object-contain"
                        style={{ filter: `drop-shadow(0 4px 12px ${p.color}66)` }} />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{p.nameAr}</div>
                      <div className="text-xs text-gray-500">{p.name}</div>
                    </div>
                    <div className="text-lg font-black" style={{ color: p.color }}>₪{p.price}</div>
                  </div>

                  {p.badge && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
                      style={{ background: `${p.color}20`, color: p.color }}
                    >
                      {p.badge}
                    </span>
                  )}

                  <div className="text-xs text-gray-400 mb-4 line-clamp-2">{p.desc}</div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setProductModal({ open: true, product: p })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold glass-card text-gray-300 hover:text-white transition-colors"
                    >
                      <FiEdit2 size={12} /> تعديل
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <FiTrash2 size={12} /> حذف
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Verifications ──────────────────────────────────────────────────── */}
        {activeTab === 'verifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {verifications.length === 0 ? (
              <div className="glass-card rounded-3xl p-16 text-center">
                <FiShield size={40} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">لا يوجد طلبات توثيق</p>
                <p className="text-gray-600 text-sm mt-1">ستظهر هنا طلبات التوثيق التي يرسلها الأعضاء</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((ver) => (
                  <motion.div
                    key={ver.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-l from-pink-600 to-pink-400 flex items-center justify-center text-sm font-bold text-white">
                            {ver.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{ver.userName}</div>
                            {ver.userCode && <div className="text-xs text-pink-400 font-mono">{ver.userCode}</div>}
                          </div>
                          <span className={`mr-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                            ver.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                            ver.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                            'bg-red-400/10 text-red-400'
                          }`}>
                            {ver.status === 'pending' ? 'قيد المراجعة' : ver.status === 'approved' ? 'موثق' : 'مرفوض'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div><span className="text-gray-500">الاسم الكامل:</span> <span className="text-gray-200">{ver.fullName}</span></div>
                          <div><span className="text-gray-500">نوع الهوية:</span> <span className="text-gray-200">{ver.idType === 'national_id' ? 'هوية وطنية' : ver.idType === 'passport' ? 'جواز سفر' : 'بطاقة'}</span></div>
                          <div><span className="text-gray-500">رقم الهوية:</span> <span className="text-gray-200 font-mono">{ver.idNumber}</span></div>
                          <div><span className="text-gray-500">تاريخ الميلاد:</span> <span className="text-gray-200">{ver.dateOfBirth}</span></div>
                          {ver.phone && <div><span className="text-gray-500">الهاتف:</span> <span className="text-gray-200 font-mono" dir="ltr">{ver.phone}</span></div>}
                          <div><span className="text-gray-500">تاريخ الطلب:</span> <span className="text-gray-200">{new Date(ver.submittedAt).toLocaleDateString('ar-EG')}</span></div>
                        </div>
                      </div>

                      {/* Image + Actions */}
                      <div className="flex flex-col gap-2 items-end min-w-[140px]">
                        {ver.idImage && (
                          <button
                            onClick={() => setViewImage(ver.idImage!)}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 glass-card px-3 py-2 rounded-xl w-full justify-center"
                          >
                            <FiEye size={13} /> عرض الهوية
                          </button>
                        )}
                        {ver.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveVerification(ver)}
                              className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 hover:bg-green-400/20 px-3 py-2 rounded-xl w-full justify-center font-semibold"
                            >
                              <FiCheck size={13} /> قبول
                            </button>
                            <button
                              onClick={() => handleRejectVerification(ver)}
                              className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20 px-3 py-2 rounded-xl w-full justify-center font-semibold"
                            >
                              <FiX size={13} /> رفض
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Members ────────────────────────────────────────────────────────── */}
        {activeTab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Add member button */}
            <div className="flex justify-end">
              <button
                onClick={() => setAddMemberOpen(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <FiPlus size={15} /> إضافة عضو / زبون
              </button>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">الزبائن والأعضاء</h2>
                  <span className="text-sm text-gray-400">
                    {members.filter((m) => m.role === 'member' || m.role === 'customer').length} شخص
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#c4718b' }} />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="بحث بالاسم أو اليوزر أو الكود..."
                      className="w-full rounded-xl pr-9 px-4 py-2.5 text-sm outline-none transition-all"
                      style={{ background: '#fff', border: '1.5px solid rgba(196,113,139,0.3)', color: '#2c1a2e' }}
                    />
                  </div>
                  <select
                    value={memberActiveFilter}
                    onChange={(e) => setMemberActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="rounded-xl px-3 py-2.5 text-sm outline-none flex-shrink-0"
                    style={{ background: '#fff', border: '1.5px solid rgba(196,113,139,0.3)', color: '#2c1a2e', width: '120px' }}
                  >
                    <option value="all">الكل</option>
                    <option value="active">نشط فقط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>
              {(() => {
                const q = memberSearch.trim().toLowerCase();
                const filtered = members.filter((m) => {
                  if (m.role !== 'member' && m.role !== 'customer') return false;
                  if (q && !m.name.toLowerCase().includes(q) && !m.username.toLowerCase().includes(q) && !(m.subscriberCode || '').toLowerCase().includes(q)) return false;
                  if (memberActiveFilter === 'active' && m.role === 'member' && !m.isActive) return false;
                  if (memberActiveFilter === 'inactive' && m.role === 'member' && m.isActive) return false;
                  return true;
                });
                return filtered.length === 0 ? (
                <div className="p-10 text-center text-gray-500">لا يوجد أعضاء مطابقون</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['الاسم', 'الهاتف', 'الدور', 'كود الإحالة', 'الأرباح', 'التوثيق', 'إجراءات'].map((h) => (
                          <th key={h} className="px-4 py-3 text-right text-gray-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((m) => (
                        <tr key={m._id} className="hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{m.name}</div>
                            <div className="text-xs text-gray-500">@{m.username}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs" dir="ltr">{m.phone}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                              m.role === 'member' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                            }`}>
                              {m.role === 'member' ? 'عضو' : 'زبون'}
                            </span>
                            {m.role === 'member' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                                m.isActive ? 'bg-green-400/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {m.isActive ? '● نشط' : '○ غير نشط'}
                              </span>
                            )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-pink-400 text-xs">{m.subscriberCode || '—'}</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">
                            ₪{(m.totalCommission || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={async () => {
                                const data = { isVerified: !m.isVerified, verificationStatus: !m.isVerified ? 'approved' : 'none' };
                                await handleSaveMember(m._id, data);
                              }}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                m.isVerified
                                  ? 'bg-green-400/10 text-green-400 hover:bg-red-400/10 hover:text-red-400'
                                  : 'bg-gray-500/10 text-gray-400 hover:bg-green-400/10 hover:text-green-400'
                              }`}
                            >
                              {m.isVerified ? <><FiCheck size={11} /> موثق</> : <><FiAlertCircle size={11} /> غير موثق</>}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setEditMember(m)}
                              className="p-1.5 glass-card rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
            </div>
          </motion.div>
        )}

        {/* ── Orders ─────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-bold text-white">إدارة الطلبات</h2>
                <span className="text-sm text-gray-400">{orders.length} طلب</span>
              </div>
              {orders.length === 0 ? (
                <div className="p-10 text-center text-gray-500">لا يوجد طلبات</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {orders.map((o) => (
                    <div key={o._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">#{o._id.slice(-8)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[o.status]?.color || 'text-gray-400 bg-white/5'}`}>
                            {o.status === 'cancelled'
                              ? (o.cancelledBy === 'user' ? 'ملغي من الزبون' : 'ملغي من الإدارة')
                              : STATUS_MAP[o.status]?.label || o.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {o.user?.name} — {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      <div className="text-pink-400 font-bold text-sm">₪{o.totalPrice?.toFixed(2)}</div>
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                        className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                        style={{ background: '#f5eef2', border: '1px solid rgba(196,113,139,0.3)', color: '#2c1a2e' }}
                      >
                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: '#fff', color: '#2c1a2e' }}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Commissions ────────────────────────────────────────────────────── */}
        {activeTab === 'commissions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── Rates ── */}
            <div className="glass-card rounded-3xl p-6 max-w-2xl">
              <h2 className="text-lg font-bold text-white mb-1">نسب العمولة</h2>
              <p className="text-sm text-gray-400 mb-5">
                تُحسب العمولة تلقائياً من سعر المنتج عند كل طلب.
              </p>
              <div className="space-y-4">
                {/* Member self rate */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-full sm:w-36 text-sm font-bold text-yellow-400">نسبة ربح العضو<div className="text-xs font-normal text-gray-500">من شراءه الخاص</div></div>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="number" min={0} max={100} step={0.5}
                      value={rates.memberSelf}
                      onChange={(e) => setRates({ ...rates, memberSelf: parseFloat(e.target.value) || 0 })}
                      className="input-field w-24 text-center" />
                    <span className="text-gray-400 text-sm font-semibold">%</span>
                    <div className="hidden sm:block flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(rates.memberSelf, 100)}%`, backgroundColor: '#EAB308' }} />
                    </div>
                  </div>
                </div>
                {/* 5 levels */}
                {[1, 2, 3, 4, 5].map((lvl, i) => {
                  const key = `level${lvl}` as keyof CommissionRates;
                  return (
                    <div key={lvl} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                      <div className={`w-full sm:w-36 text-sm font-semibold ${LEVEL_COLORS[i]}`}>
                        المستوى {lvl}
                        <div className="text-xs font-normal text-gray-500">عمولة المحيل</div>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <input type="number" min={0} max={100} step={0.5}
                          value={rates[key]}
                          onChange={(e) => setRates({ ...rates, [key]: parseFloat(e.target.value) || 0 })}
                          className="input-field w-24 text-center" />
                        <span className="text-gray-400 text-sm font-semibold">%</span>
                        <div className="hidden sm:block flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(rates[key], 100)}%`, backgroundColor: ['#E91E8C', '#6A1B9A', '#1565C0', '#00897B', '#E65100'][i] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={saveRates} className="btn-primary flex items-center gap-2 py-3 px-6">
                  {ratesSaved ? <FiCheck /> : <FiSave />}
                  {ratesSaved ? 'تم الحفظ!' : 'حفظ التغييرات'}
                </button>
                {ratesSaved && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm">
                    ✓ تم تحديث النسب
                  </motion.span>
                )}
              </div>
            </div>

            {/* ── Pay members ── */}
            <Link
              to="/admin/pay"
              className="glass-card rounded-3xl p-6 max-w-2xl flex items-center justify-between gap-4 border border-pink-500/20 hover:border-pink-500/40 transition-colors group"
              style={{ boxShadow: '0 4px 24px rgba(233,30,140,0.08)' }}
            >
              <div>
                <div className="text-base font-bold text-white mb-1">دفع للأعضاء</div>
                <div className="text-sm text-gray-400">ابحث عن عضو وادفع له مبلغاً بالشيكل مع ملاحظة اختيارية</div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0 group-hover:bg-pink-500/20 transition-colors">
                <FiDollarSign size={20} />
              </div>
            </Link>

          </motion.div>
        )}

        {/* ── Payment Requests ───────────────────────────────────────────────── */}
        {activeTab === 'payment-requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiBell size={16} className="text-orange-400" />
                  <h2 className="font-bold text-white">طلبات الدفع من الأعضاء</h2>
                </div>
                <span className="text-sm text-gray-400">{paymentRequests.length} طلب معلق</span>
              </div>
              {paymentRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <FiBell size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">لا توجد طلبات دفع معلقة</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {paymentRequests.map((pr) => {
                    const member = members.find((m) => m._id === pr.userId);
                    return (
                      <div key={pr.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                        <div className="w-10 h-10 rounded-2xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center text-orange-400 flex-shrink-0">
                          <FiDollarSign size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{pr.userName}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">
                            {pr.userCode || '—'} · {new Date(pr.requestedAt).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                        {member && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-gray-500">الرصيد المتاح</div>
                            <div className="text-sm font-bold text-green-400">₪{(member.availableCommission || 0).toFixed(2)}</div>
                          </div>
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            to="/admin/pay"
                            className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-xl hover:bg-pink-500/20 transition-colors font-semibold"
                          >
                            دفع الآن
                          </Link>
                          <button
                            onClick={async () => {
                              await adminAPI.markPaymentRequestSeen(pr.id);
                              setPaymentRequests((prev) => prev.filter((r) => r.id !== pr.id));
                            }}
                            className="text-xs bg-white/5 text-gray-400 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors font-semibold"
                          >
                            تم الاطلاع ✓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addMemberOpen && <AddMemberModal onClose={() => setAddMemberOpen(false)} onAdded={(m) => { setMembers((p) => [...p, m]); setAddMemberOpen(false); showToast(`تم إضافة ${m.name} بنجاح`); }} />}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {productModal.open && (
          <ProductForm
            product={productModal.product}
            onSave={handleSaveProduct}
            onClose={() => setProductModal({ open: false, product: null })}
          />
        )}
        {editMember && (
          <MemberEditModal
            member={editMember}
            onSave={handleSaveMember}
            onClose={() => setEditMember(null)}
          />
        )}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 w-full max-w-sm text-center"
            >
              <FiTrash2 size={40} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">حذف المنتج</h3>
              <p className="text-gray-400 text-sm mb-6">هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDeleteProduct(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl font-semibold text-sm transition-colors">
                  نعم، احذف
                </button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 glass-card py-3 text-gray-300 hover:text-white rounded-2xl font-semibold text-sm">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {viewImage && (
          <VerificationImageModal src={viewImage} onClose={() => setViewImage(null)} />
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

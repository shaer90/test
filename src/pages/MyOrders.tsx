import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { FiPackage, FiChevronDown, FiChevronUp, FiShoppingBag, FiX } from 'react-icons/fi';

interface OrderItem {
  id: string; name: string; nameAr: string; price: number; quantity: number; color: string;
}
interface Order {
  _id: string; createdAt: string; status: string; totalPrice: number;
  cancelledBy?: 'admin' | 'user';
  address?: string; paymentMethod?: string; notes?: string;
  items?: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'قيد المراجعة', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  processing: { label: 'جارٍ التجهيز', color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  shipped:    { label: 'تم الشحن',      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  delivered:  { label: 'تم التوصيل',   color: 'text-green-400',  bg: 'bg-green-400/10'  },
  cancelled:  { label: 'ملغي',          color: 'text-red-400',    bg: 'bg-red-400/10'    },
};

function cancelLabel(order: Order) {
  if (order.status !== 'cancelled') return STATUS_MAP[order.status]?.label || order.status;
  return order.cancelledBy === 'admin' ? 'ملغي من الإدارة' : 'ملغي من الزبون';
}

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getMyOrders();
      setOrders(res.data.orders as Order[]);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => { loadOrders(); }, [user]);

  const handleCancel = async (orderId: string) => {
    try {
      await ordersAPI.cancelOrder(orderId);
    } catch { /* ignore */ }
    setConfirmCancel(null);
    loadOrders();
  };

  if (orders.length === 0) {
    return (
      <div className="light-page min-h-screen pt-24 flex flex-col items-center justify-center px-4 text-center" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
        <FiPackage size={48} className="text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">لا يوجد طلبات بعد</h2>
        <p className="text-gray-400 text-sm mb-6">ابدئي التسوق وستظهر طلباتك هنا</p>
        <Link to="/products" className="btn-primary flex items-center gap-2">
          <FiShoppingBag size={16} /> تسوقي الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="light-page min-h-screen pt-20 pb-16 px-4" style={{ background: '#fdf8f5', color: '#2c1a2e' }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="pt-4 mb-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiPackage className="text-pink-400" /> طلباتي
          </h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} طلب</p>
        </motion.div>

        <div className="space-y-3">
          {orders.map((order, i) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const open = expanded === order._id;
            const canCancel = order.status === 'pending';
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-right"
                  onClick={() => setExpanded(open ? null : order._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${st.bg} ${st.color}`}>
                      {cancelLabel(order)}
                    </span>
                    <span className="text-pink-400 font-black text-sm">
                      ₪{order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white font-bold text-sm font-mono">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                  </div>
                </button>

                {/* Expandable details */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10 px-5 py-4 space-y-3"
                    >
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-8 h-8 flex-shrink-0"
                                style={{ filter: `drop-shadow(0 2px 6px ${item.color}66)` }}>
                                <svg viewBox="0 0 280 300" className="w-full h-full">
                                  <rect x="50" y="40" width="180" height="220" rx="16"
                                    fill={item.color} opacity="0.8" />
                                  <text x="140" y="165" textAnchor="middle" fill="white"
                                    fontSize="40" fontWeight="bold" opacity="0.6">
                                    {item.name.charAt(0)}
                                  </text>
                                </svg>
                              </div>
                              <div className="flex-1 text-sm text-white">{item.nameAr}</div>
                              <div className="text-xs text-gray-400">×{item.quantity}</div>
                              <div className="text-sm font-bold text-pink-400">₪{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {order.address && (
                        <div className="text-xs text-gray-400">
                          <span className="text-gray-500">العنوان: </span>{order.address}
                        </div>
                      )}
                      {order.notes && (
                        <div className="text-xs text-gray-400">
                          <span className="text-gray-500">ملاحظات: </span>{order.notes}
                        </div>
                      )}

                      {/* Cancel button — pending only */}
                      {canCancel && (
                        confirmCancel === order._id ? (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-gray-400 flex-1">تأكيد إلغاء الطلب؟</span>
                            <button
                              onClick={() => handleCancel(order._id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              نعم، إلغاء
                            </button>
                            <button
                              onClick={() => setConfirmCancel(null)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                              تراجع
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmCancel(order._id); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FiX size={13} /> إلغاء الطلب
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

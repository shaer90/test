import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ReminderBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [daysSince, setDaysSince] = useState(0);

  useEffect(() => {
    if (!user) return;
    authAPI.checkReminder().then((res) => {
      if (res.data.due) {
        setDaysSince(res.data.daysSince ?? 28);
        setShow(true);
      }
    }).catch(() => {});
  }, [user?._id]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed top-16 inset-x-0 z-40 flex justify-center px-4 pt-2 pointer-events-none"
        >
          <div className="pointer-events-auto max-w-lg w-full glass-card rounded-2xl px-5 py-3.5 flex items-center gap-3 border border-pink-500/30 shadow-lg"
            style={{ background: 'rgba(30,10,25,0.92)', backdropFilter: 'blur(20px)' }}>
            <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <FiBell className="text-pink-400" size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">وقت تجديد مخزونك! 🛍️</p>
              <p className="text-gray-400 text-xs mt-0.5">
                مضى {daysSince} يوم على آخر دورة — حان وقت شراء الفوط
              </p>
            </div>
            <Link
              to="/products"
              onClick={() => setShow(false)}
              className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <FiShoppingBag size={13} /> تسوقي الآن
            </Link>
            <button
              onClick={() => setShow(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <FiX size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <img src="/logo.png" alt="Allsence" style={{ height: 56, width: 'auto', objectFit: 'contain', marginBottom: 12 }} />
            <p className="text-gray-400 text-sm leading-relaxed">
              راحتك مش رفاهية — منتجات العناية النسائية المتميزة بتقنية اليابانية المتقدمة.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/Allsence.pal"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 glass-card rounded-full flex items-center justify-center text-gray-400 hover:text-pink-400 hover:border-pink-500/50 transition-all"
              >
                <FiFacebook size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 glass-card rounded-full flex items-center justify-center text-gray-400 hover:text-pink-400 hover:border-pink-500/50 transition-all"
              >
                <FiInstagram size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 glass-card rounded-full flex items-center justify-center text-gray-400 hover:text-pink-400 hover:border-pink-500/50 transition-all"
              >
                <FiYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'الرئيسية' },
                { to: '/products', label: 'المنتجات' },
                { to: '/about', label: 'من نحن' },
                { to: '/contact', label: 'تواصل معنا' },
                { to: '/register', label: 'انضم كعضو' },
                { to: '/login', label: 'تسجيل الدخول' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-gray-400 hover:text-pink-400 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-bold mb-4">منتجاتنا</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Allsence Daily Pads — فوط يومية</li>
              <li>Allsence Ultra Night — فوط ليلية</li>
              <li>Allsence Plus — فوط بلس</li>
              <li>Allsence Premium XXL — بريميوم</li>
              <li>Allsence Premium Pants — بنطلون</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Allsence. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

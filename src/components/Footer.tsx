import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#fdf8f5', borderTop: '1px solid rgba(196,113,139,0.2)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <img src="/logo.png" alt="Allsence" style={{ height: 56, width: 'auto', objectFit: 'contain', marginBottom: 12 }} />
            <p className="text-sm leading-relaxed" style={{ color: '#7a5c6e' }}>
              راحتك مش رفاهية — منتجات العناية النسائية المتميزة بتقنية اليابانية المتقدمة.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/Allsence.pal"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(196,113,139,0.1)', border: '1px solid rgba(196,113,139,0.2)', color: '#7a5c6e' }}
              >
                <FiFacebook size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(196,113,139,0.1)', border: '1px solid rgba(196,113,139,0.2)', color: '#7a5c6e' }}
              >
                <FiInstagram size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(196,113,139,0.1)', border: '1px solid rgba(196,113,139,0.2)', color: '#7a5c6e' }}
              >
                <FiYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#2c1a2e' }}>روابط سريعة</h4>
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
                    className="text-sm transition-colors hover:text-pink-500"
                    style={{ color: '#7a5c6e' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: '#2c1a2e' }}>منتجاتنا</h4>
            <ul className="space-y-2 text-sm" style={{ color: '#7a5c6e' }}>
              <li>Allsence Daily Pads — فوط يومية</li>
              <li>Allsence Ultra Night — فوط ليلية</li>
              <li>Allsence Plus — فوط بلس</li>
              <li>Allsence Premium XXL — بريميوم</li>
              <li>Allsence Premium Pants — بنطلون</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(196,113,139,0.15)', color: '#9e7d8e' }}>
          © {new Date().getFullYear()} Allsence. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

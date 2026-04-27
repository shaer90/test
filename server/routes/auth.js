const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbMod = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const COUNTRY_FIRST_LETTER = {
  'أفغانستان':'A','ألبانيا':'A','الجزائر':'A','أندورا':'A','أنغولا':'A',
  'أنتيغوا وبربودا':'A','الأرجنتين':'A','أرمينيا':'A','أستراليا':'A','النمسا':'A','أذربيجان':'A',
  'جزر البهاما':'B','البحرين':'B','بنغلاديش':'B','بربادوس':'B','بيلاروسيا':'B','بلجيكا':'B',
  'بليز':'B','بنين':'B','بوتان':'B','بوليفيا':'B','البوسنة والهرسك':'B','بوتسوانا':'B',
  'البرازيل':'B','بروناي':'B','بلغاريا':'B','بوركينا فاسو':'B','بوروندي':'B',
  'الرأس الأخضر':'C','كمبوديا':'C','الكاميرون':'C','كندا':'C',
  'جمهورية أفريقيا الوسطى':'C','تشاد':'C','تشيلي':'C','الصين':'C',
  'كولومبيا':'C','جزر القمر':'C','جمهورية الكونغو':'C','جمهورية الكونغو الديمقراطية':'C',
  'كوستاريكا':'C','كوت ديفوار':'C','كرواتيا':'C','كوبا':'C','قبرص':'C','التشيك':'C',
  'الدنمارك':'D','جيبوتي':'D','دومينيكا':'D','جمهورية الدومينيكان':'D',
  'الإكوادور':'E','مصر':'E','السلفادور':'E','غينيا الاستوائية':'E','إريتريا':'E',
  'إستونيا':'E','إسواتيني':'E','إثيوبيا':'E',
  'فيجي':'F','فنلندا':'F','فرنسا':'F',
  'الغابون':'G','غامبيا':'G','جورجيا':'G','ألمانيا':'G','غانا':'G','اليونان':'G',
  'غرينادا':'G','غواتيمالا':'G','غينيا':'G','غينيا بيساو':'G','غيانا':'G',
  'هايتي':'H','هندوراس':'H','المجر':'H',
  'آيسلندا':'I','الهند':'I','إندونيسيا':'I','إيران':'I','العراق':'I',
  'إيرلندا':'I','إسرائيل':'I','إيطاليا':'I',
  'جامايكا':'J','اليابان':'J','الأردن':'J',
  'كازاخستان':'K','كينيا':'K','كيريباتي':'K','كوريا الشمالية':'K','كوريا الجنوبية':'K',
  'كوسوفو':'K','الكويت':'K','قيرغيزستان':'K',
  'لاوس':'L','لاتفيا':'L','لبنان':'L','ليسوتو':'L','ليبيريا':'L','ليبيا':'L',
  'ليختنشتاين':'L','ليتوانيا':'L','لوكسمبورغ':'L',
  'مدغشقر':'M','مالاوي':'M','ماليزيا':'M','المالديف':'M','مالي':'M','مالطا':'M',
  'جزر مارشال':'M','موريتانيا':'M','موريشيوس':'M','المكسيك':'M','ميكرونيزيا':'M',
  'مولدوفا':'M','موناكو':'M','منغوليا':'M','الجبل الأسود':'M','المغرب':'M','موزمبيق':'M','ميانمار':'M',
  'ناميبيا':'N','ناورو':'N','نيبال':'N','هولندا':'N','نيوزيلندا':'N','نيكاراغوا':'N',
  'النيجر':'N','نيجيريا':'N','مقدونيا الشمالية':'N','النرويج':'N',
  'عمان':'O',
  'باكستان':'P','بالاو':'P','فلسطين':'P','بنما':'P','بابوا غينيا الجديدة':'P',
  'باراغواي':'P','بيرو':'P','الفلبين':'P','بولندا':'P','البرتغال':'P',
  'قطر':'Q',
  'رومانيا':'R','روسيا':'R','رواندا':'R',
  'سانت كيتس ونيفيس':'S','سانت لوسيا':'S','سانت فينسنت وجزر غرينادين':'S',
  'ساموا':'S','سان مارينو':'S','ساو تومي وبرينسيب':'S',
  'المملكة العربية السعودية':'S','السعودية':'S','السنغال':'S','صربيا':'S',
  'سيشل':'S','سيراليون':'S','سنغافورة':'S','سلوفاكيا':'S','سلوفينيا':'S',
  'جزر سليمان':'S','الصومال':'S','جنوب أفريقيا':'S','جنوب السودان':'S',
  'إسبانيا':'S','سريلانكا':'S','السودان':'S','سورينام':'S','السويد':'S','سويسرا':'S','سوريا':'S',
  'تايوان':'T','طاجيكستان':'T','تنزانيا':'T','تايلاند':'T','تيمور الشرقية':'T',
  'توغو':'T','تونغا':'T','ترينيداد وتوباغو':'T','تونس':'T','تركيا':'T','تركمانستان':'T','توفالو':'T',
  'أوغندا':'U','أوكرانيا':'U','الإمارات العربية المتحدة':'U','الإمارات':'U',
  'المملكة المتحدة':'U','بريطانيا':'U','الولايات المتحدة':'U','أمريكا':'U',
  'أوروغواي':'U','أوزبكستان':'U',
  'فانواتو':'V','الفاتيكان':'V','فنزويلا':'V','فيتنام':'V',
  'اليمن':'Y','زامبيا':'Z','زيمبابوي':'Z',
};

function countryFirstLetter(c) {
  if (!c) return 'M';
  const t = c.trim();
  if (COUNTRY_FIRST_LETTER[t]) return COUNTRY_FIRST_LETTER[t];
  const latin = t.match(/[a-zA-Z]/);
  return latin ? latin[0].toUpperCase() : 'M';
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });

  const db = dbMod.db;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET, { expiresIn: '30d' },
  );
  res.cookie('allsence_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({ token, user: dbMod.formatUser(user) });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, name, phone, password, role, sponsorCode, country, city, ageGroup, reminderEnabled, lastPeriodDate } = req.body || {};
  if (!username || !name || !phone || !password || !role)
    return res.status(400).json({ message: 'يرجى إدخال جميع الحقول المطلوبة' });

  const db = dbMod.db;

  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase().trim()))
    return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });

  if (sponsorCode) {
    const sponsor = db.prepare('SELECT id FROM users WHERE subscriber_code = ?').get(sponsorCode.trim().toUpperCase());
    if (!sponsor) return res.status(400).json({ message: 'كود الإحالة غير موجود' });
  }

  let subscriberCode = null;
  if (role === 'member') {
    const prefix = countryFirstLetter(country);
    let code;
    do {
      code = prefix + Math.floor(10000000 + Math.random() * 90000000).toString();
    } while (db.prepare('SELECT id FROM users WHERE subscriber_code = ?').get(code));
    subscriberCode = code;
  }

  const id = `user-${Date.now()}`;
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO users (id,username,name,phone,role,password_hash,subscriber_code,sponsor_code,country,city,is_verified,verification_status,available_commission,total_commission,created_at,date_of_birth,reminder_enabled,last_period_date) VALUES (?,?,?,?,?,?,?,?,?,?,0,'none',0,0,?,?,?,?)`)
    .run(id, username.toLowerCase().trim(), name.trim(), phone.trim(), role, bcrypt.hashSync(password, 10), subscriberCode, sponsorCode ? sponsorCode.trim().toUpperCase() : null, country ? country.trim() : null, city ? city.trim() : null, createdAt, ageGroup || null, reminderEnabled ? 1 : 0, (reminderEnabled && lastPeriodDate) ? lastPeriodDate : null);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = jwt.sign({ userId: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('allsence_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({ token, user: dbMod.formatUser(newUser) });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = dbMod.db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ user: null });
  res.json({ user: dbMod.formatUser(user) });
});

// GET /api/auth/check-referral/:code
router.get('/check-referral/:code', (req, res) => {
  const member = dbMod.db.prepare('SELECT name FROM users WHERE subscriber_code = ?').get(req.params.code.toUpperCase());
  if (!member) return res.status(404).json({ message: 'الكود غير موجود' });
  res.json({ valid: true, sponsor: { name: member.name } });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('allsence_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true });
});

// PUT /api/auth/reminder  — update reminder settings
router.put('/reminder', authMiddleware, (req, res) => {
  const { reminderEnabled, lastPeriodDate } = req.body || {};
  const db = dbMod.db;
  db.prepare('UPDATE users SET reminder_enabled = ?, last_period_date = ? WHERE id = ?')
    .run(reminderEnabled ? 1 : 0, (reminderEnabled && lastPeriodDate) ? lastPeriodDate : null, req.user.userId);
  res.json({ success: true });
});

// GET /api/auth/reminder-check  — check if 28-day reminder is due
router.get('/reminder-check', authMiddleware, (req, res) => {
  const db = dbMod.db;
  const user = db.prepare('SELECT reminder_enabled, last_period_date FROM users WHERE id = ?').get(req.user.userId);
  if (!user || !user.reminder_enabled || !user.last_period_date)
    return res.json({ due: false });
  const daysDiff = Math.floor((Date.now() - new Date(user.last_period_date).getTime()) / 86400000);
  res.json({ due: daysDiff >= 28, daysSince: daysDiff });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const db = dbMod.db;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
  res.json({ success: true });
});

module.exports = router;

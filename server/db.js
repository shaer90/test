const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'allsence.db');

// ── Wrapper around sql.js that mimics better-sqlite3 prepare/run/get/all ───────

class DB {
  constructor(SQL) {
    const buf = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE) : null;
    this._db = new SQL.Database(buf ? new Uint8Array(buf) : null);
  }

  exec(sql) {
    this._db.run(sql);
    this._flush();
  }

  prepare(sql) {
    const self = this;
    return {
      run(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        self._db.run(sql, params);
        self._flush();
      },
      get(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      all(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  }

  _flush() {
    fs.writeFileSync(DB_FILE, Buffer.from(this._db.export()));
  }
}

// ── Module-level db reference (set by initDB) ──────────────────────────────────

const mod = module.exports;
mod.db = null;

async function initDB() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file),
  });
  const db = new DB(SQL);
  mod.db = db;

  // ── Schema ───────────────────────────────────────────────────────────────────
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    phone TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
    password_hash TEXT NOT NULL, subscriber_code TEXT UNIQUE, sponsor_code TEXT,
    available_commission REAL DEFAULT 0, total_commission REAL DEFAULT 0,
    country TEXT, city TEXT, is_verified INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'none', created_at TEXT NOT NULL,
    date_of_birth TEXT, reminder_enabled INTEGER DEFAULT 0, last_period_date TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, name_ar TEXT NOT NULL,
    price REAL NOT NULL, count INTEGER NOT NULL DEFAULT 0,
    color TEXT, color_dark TEXT, bg_from TEXT, bg_to TEXT, badge TEXT,
    features TEXT DEFAULT '[]', desc_short TEXT DEFAULT '',
    desc_long TEXT DEFAULT '', specs TEXT DEFAULT '[]',
    image TEXT, in_stock INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    user_name TEXT, user_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending', total_price REAL NOT NULL,
    address TEXT, payment_method TEXT, notes TEXT, cancelled_by TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
    product_id TEXT, product_name TEXT, product_name_ar TEXT,
    price REAL, quantity INTEGER, color TEXT
  );
  CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_names TEXT,
    order_total REAL, rate REAL, amount REAL, type TEXT, level INTEGER,
    member_id TEXT NOT NULL, member_name TEXT,
    from_member_id TEXT, from_member_name TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, member_id TEXT NOT NULL, member_name TEXT,
    amount REAL NOT NULL, note TEXT, paid_at TEXT NOT NULL, paid_by TEXT
  );
  CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
    user_name TEXT, user_code TEXT, id_type TEXT, id_number TEXT,
    full_name TEXT, date_of_birth TEXT, phone TEXT, id_image TEXT,
    status TEXT DEFAULT 'pending', submitted_at TEXT NOT NULL, rejection_reason TEXT
  );
  CREATE TABLE IF NOT EXISTS commission_rates (
    id INTEGER PRIMARY KEY, member_self REAL DEFAULT 15,
    level1 REAL DEFAULT 10, level2 REAL DEFAULT 8,
    level3 REAL DEFAULT 6, level4 REAL DEFAULT 4, level5 REAL DEFAULT 2
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    product_id TEXT NOT NULL, product_name TEXT, product_name_ar TEXT,
    price REAL, item_count INTEGER, color TEXT, quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
  );
  `);

  // ── Migrations for existing DBs ───────────────────────────────────────────
  try { db.exec('ALTER TABLE users ADD COLUMN date_of_birth TEXT'); } catch(_) {}
  try { db.exec('ALTER TABLE users ADD COLUMN reminder_enabled INTEGER DEFAULT 0'); } catch(_) {}
  try { db.exec('ALTER TABLE users ADD COLUMN last_period_date TEXT'); } catch(_) {}
  try { db.exec('ALTER TABLE verifications ADD COLUMN phone TEXT'); } catch(_) {}

  // ── Seeds ──────────────────────────────────────────────────────────────────
  if (!db.prepare('SELECT id FROM commission_rates WHERE id = 1').get()) {
    db.prepare('INSERT INTO commission_rates (id,member_self,level1,level2,level3,level4,level5) VALUES (?,?,?,?,?,?,?)').run(1, 15, 10, 8, 6, 4, 2);
  }

  const SEED_USERS = [
    { id:'demo-admin-001', u:'admin', n:'مدير النظام', p:'+970599000001', r:'super_admin', pw:'admin123', sub:'ADMIN001', spon:null, c:null, ci:null, iv:1, vs:'approved', ca:'2024-01-01T00:00:00Z' },
    { id:'demo-member-001', u:'member', n:'سارة محمد', p:'+970599000002', r:'member', pw:'member123', sub:'SR123456', spon:'ADMIN001', c:'فلسطين', ci:'رام الله', iv:0, vs:'none', ca:'2024-02-15T00:00:00Z' },
    { id:'demo-customer-001', u:'customer', n:'نور أحمد', p:'+970599000003', r:'customer', pw:'customer123', sub:null, spon:null, c:null, ci:null, iv:0, vs:'none', ca:'2024-03-10T00:00:00Z' },
  ];
  const insU = db.prepare(`INSERT OR IGNORE INTO users (id,username,name,phone,role,password_hash,subscriber_code,sponsor_code,country,city,is_verified,verification_status,available_commission,total_commission,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,0,?)`);
  for (const u of SEED_USERS) {
    insU.run(u.id, u.u, u.n, u.p, u.r, bcrypt.hashSync(u.pw, 10), u.sub, u.spon, u.c, u.ci, u.iv, u.vs, u.ca);
  }

  const SEED_PRODUCTS = [
    { id:'daily-pads', nm:'Daily Pads', na:'فوط يومية', pr:12.99, co:60, cl:'#E91E8C', cd:'#880E4F', bf:'#1a0010', bt:'#2d0020', ba:'الأكثر مبيعاً', fe:['برائحة الصابون المنعشة','ناعمة على البشرة','60 قطعة في العبوة','للاستخدام اليومي'], ds:'فوطتك اليومية المثالية.', dl:'الفوط اليومية من Allsence مصممة لتمنحك الراحة والحماية الكاملة طوال اليوم.', sp:[{label:'الكمية',value:'60 فوطة'},{label:'المقاس',value:'Regular'},{label:'الرائحة',value:'صابون منعش'},{label:'المادة',value:'ألياف ناعمة'},{label:'الاستخدام',value:'يومي'}] },
    { id:'ultra-night', nm:'Ultra Night', na:'فوط ليلية ألترا', pr:9.99, co:7, cl:'#2196F3', cd:'#0D47A1', bf:'#000d1a', bt:'#001a33', ba:'100% قطن', fe:['تقنية Liquid Lock GEL','حماية ليلية فائقة','100% قطن طبيعي','جانبان واقيان'], ds:'الحماية الليلية الأكثر موثوقية.', dl:'Ultra Night من Allsence هي الحل المثالي للحماية الليلية.', sp:[{label:'الكمية',value:'7 فوطة'},{label:'المقاس',value:'XL Night'},{label:'التقنية',value:'Liquid Lock GEL'},{label:'المادة',value:'100% قطن طبيعي'},{label:'الاستخدام',value:'ليلي'}] },
    { id:'plus', nm:'Plus', na:'فوط بلس', pr:10.99, co:8, cl:'#9C27B0', cd:'#4A148C', bf:'#0d0015', bt:'#1a0030', ba:'Extra Large', fe:['تقنية Liquid Lock GEL','حجم Extra Large','حماية طوال اليوم','قطن 100% طبيعي'], ds:'حماية معززة في الأيام الصعبة.', dl:'فوط بلس من Allsence مصممة للأيام التي تحتاجين فيها لحماية إضافية.', sp:[{label:'الكمية',value:'8 فوطة'},{label:'المقاس',value:'Extra Large'},{label:'التقنية',value:'Liquid Lock GEL'},{label:'المادة',value:'100% قطن طبيعي'},{label:'الاستخدام',value:'نهاري مكثف'}] },
    { id:'premium-xxl', nm:'Premium XXL', na:'بريميوم XXL', pr:15.99, co:7, cl:'#FF6D00', cd:'#BF360C', bf:'#1a0a00', bt:'#2d1500', ba:'للبشرة الحساسة', fe:['100 طبقة تنفس','لأصحاب PCOS','مضاد للبكتيريا','فردية التغليف'], ds:'مخصصة للنساء ذوات البشرة الحساسة.', dl:'Premium XXL هي الخيار الأمثل للنساء اللواتي يعانين من PCOS.', sp:[{label:'الكمية',value:'7 فوطة'},{label:'المقاس',value:'XXL'},{label:'الطبقات',value:'100 طبقة تنفس'},{label:'المادة',value:'100% قطن عضوي'},{label:'الاستخدام',value:'للبشرة الحساسة'}] },
    { id:'premium-pants', nm:'Premium Pants', na:'بنطلون بريميوم', pr:18.99, co:3, cl:'#E91E8C', cd:'#880E4F', bf:'#1a0015', bt:'#2d0025', ba:'Super Comfort', fe:['راحة قصوى 360°','يشبه الملابس الداخلية','مثالي للسفر والرياضة','سهل الارتداء والخلع'], ds:'ثقة كاملة وحرية حركة.', dl:'Premium Pants من Allsence يمنحك تجربة حماية لم تشعري بها من قبل.', sp:[{label:'الكمية',value:'3 قطع'},{label:'المقاس',value:'One Size Fits Most'},{label:'الحماية',value:'360 درجة'},{label:'المادة',value:'قطن + ألياف خاصة'},{label:'الاستخدام',value:'سفر / رياضة / يومي'}] },
  ];
  const insP = db.prepare(`INSERT OR IGNORE INTO products (id,name,name_ar,price,count,color,color_dark,bg_from,bg_to,badge,features,desc_short,desc_long,specs) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of SEED_PRODUCTS) {
    insP.run(p.id, p.nm, p.na, p.pr, p.co, p.cl, p.cd, p.bf, p.bt, p.ba, JSON.stringify(p.fe), p.ds, p.dl, JSON.stringify(p.sp));
  }

  return db;
}

mod.initDB = initDB;

// ── Row formatters ─────────────────────────────────────────────────────────────

mod.formatUser = function formatUser(u) {
  if (!u) return null;
  return {
    _id: u.id, username: u.username, name: u.name, phone: u.phone, role: u.role,
    subscriberCode: u.subscriber_code || undefined, sponsorCode: u.sponsor_code || undefined,
    availableCommission: u.available_commission || 0, totalCommission: u.total_commission || 0,
    country: u.country || undefined, city: u.city || undefined,
    isVerified: u.is_verified === 1, verificationStatus: u.verification_status || 'none',
    ageGroup: u.date_of_birth || undefined,
    reminderEnabled: u.reminder_enabled === 1,
    lastPeriodDate: u.last_period_date || undefined,
  };
};

mod.formatProduct = function formatProduct(p) {
  if (!p) return null;
  return {
    id: p.id, name: p.name, nameAr: p.name_ar, price: p.price, count: p.count,
    color: p.color, colorDark: p.color_dark, bg: [p.bg_from, p.bg_to], badge: p.badge || '',
    features: JSON.parse(p.features || '[]'), desc: p.desc_short || '', longDesc: p.desc_long || '',
    specs: JSON.parse(p.specs || '[]'), image: p.image || undefined,
  };
};

mod.formatOrder = function formatOrder(o) {
  if (!o) return null;
  const db = mod.db;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id).map((i) => ({
    id: i.product_id, name: i.product_name, nameAr: i.product_name_ar,
    price: i.price, quantity: i.quantity, color: i.color,
  }));
  return {
    _id: o.id, createdAt: o.created_at, status: o.status, totalPrice: o.total_price,
    address: o.address || undefined, paymentMethod: o.payment_method || undefined,
    notes: o.notes || undefined, cancelledBy: o.cancelled_by || undefined,
    user: o.user_id ? { name: o.user_name, phone: o.user_phone, id: o.user_id } : undefined,
    items,
  };
};

mod.calculateCommissions = function calculateCommissions(orderId, buyerId) {
  const db = mod.db;
  const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(buyerId);
  if (!buyer || buyer.role === 'customer') return;
  if (db.prepare('SELECT id FROM commissions WHERE order_id = ?').get(orderId)) return;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const rates = db.prepare('SELECT * FROM commission_rates WHERE id = 1').get();
  const productNames = items.map((i) => i.product_name_ar).join(', ') || 'منتج';
  const total = order.total_price;
  const now = new Date().toISOString();
  const ts = Date.now();
  const memberAmounts = {};

  const insC = db.prepare(`INSERT INTO commissions (id,order_id,product_names,order_total,rate,amount,type,level,member_id,member_name,from_member_id,from_member_name,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  if (rates.member_self > 0) {
    const amt = +((total * rates.member_self) / 100).toFixed(2);
    insC.run(`comm-${ts}-self`, orderId, productNames, total, rates.member_self, amt, 'self', 0, buyer.id, buyer.name, buyer.id, buyer.name, now);
    memberAmounts[buyer.id] = (memberAmounts[buyer.id] || 0) + amt;
  }

  const LK = ['level1','level2','level3','level4','level5'];
  let sc = buyer.sponsor_code;
  for (let i = 0; i < 5; i++) {
    if (!sc) break;
    const sp = db.prepare('SELECT * FROM users WHERE subscriber_code = ?').get(sc);
    if (!sp) break;
    const rate = rates[LK[i]];
    if (rate > 0) {
      const amt = +((total * rate) / 100).toFixed(2);
      insC.run(`comm-${ts}-${LK[i]}-${sp.id}`, orderId, productNames, total, rate, amt, LK[i], i+1, sp.id, sp.name, buyer.id, buyer.name, now);
      memberAmounts[sp.id] = (memberAmounts[sp.id] || 0) + amt;
    }
    sc = sp.sponsor_code;
  }

  const updBal = db.prepare('UPDATE users SET available_commission = available_commission + ?, total_commission = total_commission + ? WHERE id = ?');
  for (const [mid, amt] of Object.entries(memberAmounts)) updBal.run(amt, amt, mid);
};

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const dbMod = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { formatCommission, formatPayment, formatRates } = require('./network');

router.use(authMiddleware, adminOnly);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const db = dbMod.db;
  const totalMembers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role IN ('member','admin','super_admin')").get().c;
  const totalCustomers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_price),0) AS s FROM orders WHERE status != 'cancelled'").get().s;
  res.json({ totalMembers, totalCustomers, totalOrders, totalRevenue });
});

// GET /api/admin/members
router.get('/members', (req, res) => {
  const rows = dbMod.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json({ members: rows.map(dbMod.formatUser) });
});

// PUT /api/admin/members/:id
router.put('/members/:id', (req, res) => {
  const db = dbMod.db;
  const fields = ['name','phone','role','country','city','availableCommission','totalCommission','isVerified','verificationStatus','subscriberCode','sponsorCode'];
  const colMap = { availableCommission:'available_commission', totalCommission:'total_commission', isVerified:'is_verified', verificationStatus:'verification_status', subscriberCode:'subscriber_code', sponsorCode:'sponsor_code' };
  const updates = []; const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      const col = colMap[f] || f;
      updates.push(`${col} = ?`);
      values.push(f === 'isVerified' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (updates.length) {
    values.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', (req, res) => {
  dbMod.db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/admin/members/:id/reset-password
router.post('/members/:id/reset-password', (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  const user = dbMod.db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
  dbMod.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.params.id);
  res.json({ success: true });
});

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  const rows = dbMod.db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json({ orders: rows.map(dbMod.formatOrder) });
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const db = dbMod.db;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

  const cancelledBy = status === 'cancelled' ? 'admin' : null;
  db.prepare('UPDATE orders SET status = ?, cancelled_by = ? WHERE id = ?').run(status, cancelledBy, order.id);

  if (status === 'delivered') dbMod.calculateCommissions(order.id, order.user_id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  res.json({ order: dbMod.formatOrder(updated) });
});

// GET /api/admin/commission-rates
router.get('/commission-rates', (req, res) => {
  const row = dbMod.db.prepare('SELECT * FROM commission_rates WHERE id = 1').get();
  res.json({ rates: formatRates(row) });
});

// PUT /api/admin/commission-rates
router.put('/commission-rates', (req, res) => {
  const { memberSelf, level1, level2, level3, level4, level5 } = req.body || {};
  dbMod.db.prepare('UPDATE commission_rates SET member_self=?,level1=?,level2=?,level3=?,level4=?,level5=? WHERE id=1')
    .run(memberSelf, level1, level2, level3, level4, level5);
  res.json({ success: true });
});

// GET /api/admin/commissions
router.get('/commissions', (req, res) => {
  const { memberId } = req.query;
  const rows = memberId
    ? dbMod.db.prepare('SELECT * FROM commissions WHERE member_id = ? ORDER BY created_at DESC').all(memberId)
    : dbMod.db.prepare('SELECT * FROM commissions ORDER BY created_at DESC').all();
  res.json({ commissions: rows.map(formatCommission) });
});

// GET /api/admin/payments
router.get('/payments', (req, res) => {
  const { memberId } = req.query;
  const rows = memberId
    ? dbMod.db.prepare('SELECT * FROM payments WHERE member_id = ? ORDER BY paid_at DESC').all(memberId)
    : dbMod.db.prepare('SELECT * FROM payments ORDER BY paid_at DESC').all();
  res.json({ payments: rows.map(formatPayment) });
});

// POST /api/admin/pay-member
router.post('/pay-member', (req, res) => {
  const { memberId, amount, note } = req.body || {};
  const db = dbMod.db;
  const member = db.prepare('SELECT * FROM users WHERE id = ?').get(memberId);
  if (!member) return res.status(404).json({ message: 'العضو غير موجود' });

  const paymentId = `pay-${Date.now()}`;
  const paidAt = new Date().toISOString();
  db.prepare(`INSERT INTO payments (id,member_id,member_name,amount,note,paid_at,paid_by) VALUES (?,?,?,?,?,?,'admin')`)
    .run(paymentId, memberId, member.name, amount, note || null, paidAt);
  db.prepare('UPDATE users SET available_commission = MAX(0, available_commission - ?) WHERE id = ?').run(amount, memberId);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  res.json({ payment: formatPayment(payment) });
});

// ── Products ──────────────────────────────────────────────────────────────────

router.post('/products', (req, res) => {
  const p = req.body;
  const id = p.id || `product-${Date.now()}`;
  dbMod.db.prepare(`INSERT OR REPLACE INTO products (id,name,name_ar,price,count,color,color_dark,bg_from,bg_to,badge,features,desc_short,desc_long,specs,image) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, p.name||'', p.nameAr||'', p.price||0, p.count||1, p.color||'#E91E8C', p.colorDark||'#880E4F', (p.bg||[])[0]||'#1a0010', (p.bg||[])[1]||'#2d0020', p.badge||'', JSON.stringify(p.features||[]), p.desc||'', p.longDesc||'', JSON.stringify(p.specs||[]), p.image||null);
  const row = dbMod.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product: dbMod.formatProduct(row) });
});

router.put('/products/:id', (req, res) => {
  const p = req.body;
  const e = dbMod.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ message: 'المنتج غير موجود' });
  dbMod.db.prepare(`UPDATE products SET name=?,name_ar=?,price=?,count=?,color=?,color_dark=?,bg_from=?,bg_to=?,badge=?,features=?,desc_short=?,desc_long=?,specs=?,image=? WHERE id=?`)
    .run(p.name??e.name, p.nameAr??e.name_ar, p.price??e.price, p.count??e.count, p.color??e.color, p.colorDark??e.color_dark, (p.bg??[])[0]??e.bg_from, (p.bg??[])[1]??e.bg_to, p.badge??e.badge, p.features!==undefined?JSON.stringify(p.features):e.features, p.desc??e.desc_short, p.longDesc??e.desc_long, p.specs!==undefined?JSON.stringify(p.specs):e.specs, p.image!==undefined?p.image:e.image, req.params.id);
  res.json({ success: true });
});

router.delete('/products/:id', (req, res) => {
  dbMod.db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Verifications ─────────────────────────────────────────────────────────────

router.get('/verifications', (req, res) => {
  const rows = dbMod.db.prepare('SELECT * FROM verifications ORDER BY submitted_at DESC').all();
  res.json({ verifications: rows.map((v) => ({ id:v.id, userId:v.user_id, userName:v.user_name, userCode:v.user_code, idType:v.id_type, idNumber:v.id_number, fullName:v.full_name, dateOfBirth:v.date_of_birth, phone:v.phone||null, idImage:v.id_image, status:v.status, submittedAt:v.submitted_at, rejectionReason:v.rejection_reason })) });
});

router.put('/verifications/:id/approve', (req, res) => {
  const db = dbMod.db;
  const ver = db.prepare('SELECT * FROM verifications WHERE id = ?').get(req.params.id);
  if (!ver) return res.status(404).json({ message: 'الطلب غير موجود' });
  db.prepare("UPDATE verifications SET status='approved' WHERE id=?").run(ver.id);
  db.prepare("UPDATE users SET is_verified=1, verification_status='approved' WHERE id=?").run(ver.user_id);
  res.json({ success: true });
});

router.put('/verifications/:id/reject', (req, res) => {
  const { reason } = req.body || {};
  const db = dbMod.db;
  const ver = db.prepare('SELECT * FROM verifications WHERE id = ?').get(req.params.id);
  if (!ver) return res.status(404).json({ message: 'الطلب غير موجود' });
  db.prepare("UPDATE verifications SET status='rejected', rejection_reason=? WHERE id=?").run(reason||null, ver.id);
  db.prepare("UPDATE users SET is_verified=0, verification_status='rejected' WHERE id=?").run(ver.user_id);
  res.json({ success: true });
});

module.exports = router;

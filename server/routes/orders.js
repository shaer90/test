const router = require('express').Router();
const dbMod = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/orders
router.post('/', authMiddleware, (req, res) => {
  const { items, totalPrice, address, paymentMethod, notes, fullName, phone } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: 'لا توجد منتجات في الطلب' });

  const db = dbMod.db;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(401).json({ message: 'غير مصرح' });

  // Commission balance deduction
  if (paymentMethod === 'commission') {
    if ((user.available_commission || 0) < totalPrice) {
      return res.status(400).json({ message: `الرصيد غير كافٍ. رصيدك المتاح ₪${(user.available_commission || 0).toFixed(2)}` });
    }
    db.prepare('UPDATE users SET available_commission = available_commission - ? WHERE id = ?').run(totalPrice, user.id);
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO payments (id,member_id,member_name,amount,note,paid_at,paid_by) VALUES (?,?,?,?,?,?,?)`)
      .run(`pay-comm-${Date.now()}`, user.id, user.name, totalPrice, 'خصم من الرصيد المتاح', now, user.id);
  }

  const orderId = `ORD-${Date.now().toString().slice(-8).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  db.prepare(`INSERT INTO orders (id,user_id,user_name,user_phone,status,total_price,address,payment_method,notes,created_at) VALUES (?,?,?,?,'pending',?,?,?,?,?)`)
    .run(orderId, user.id, fullName || user.name, phone || user.phone, totalPrice, address, paymentMethod, notes || null, createdAt);

  const insItem = db.prepare(`INSERT INTO order_items (id,order_id,product_id,product_name,product_name_ar,price,quantity,color) VALUES (?,?,?,?,?,?,?,?)`);
  for (const item of items) {
    insItem.run(`item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, orderId, item.id, item.name, item.nameAr, item.price, item.quantity, item.color);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({ order: dbMod.formatOrder(order) });
});

// GET /api/orders/my
router.get('/my', authMiddleware, (req, res) => {
  const rows = dbMod.db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.userId);
  res.json({ orders: rows.map(dbMod.formatOrder) });
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authMiddleware, (req, res) => {
  const db = dbMod.db;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
  if (order.user_id !== req.user.userId) return res.status(403).json({ message: 'غير مصرح' });
  if (order.status !== 'pending') return res.status(400).json({ message: 'لا يمكن إلغاء هذا الطلب' });

  db.prepare("UPDATE orders SET status = 'cancelled', cancelled_by = 'user' WHERE id = ?").run(order.id);
  res.json({ success: true });
});

// POST /api/orders/payment-request — member requests payment
router.post('/payment-request', authMiddleware, (req, res) => {
  try {
    const db = dbMod.db;

    // Ensure table exists
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS payment_requests (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
        user_name TEXT, user_code TEXT,
        status TEXT DEFAULT 'pending', requested_at TEXT NOT NULL
      )`);
    } catch (_) {}

    const userId = req.user.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(401).json({ message: 'غير مصرح' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeOrder = db.prepare(
      'SELECT id FROM orders WHERE user_id = ? AND created_at > ? LIMIT 1'
    ).get(userId, thirtyDaysAgo);
    if (!activeOrder) {
      return res.status(400).json({ message: 'لا يمكن طلب الدفع لأنك غير نشطة. يجب تقديم طلب شراء خلال آخر 30 يوماً.' });
    }

    const existing = db.prepare(
      "SELECT id FROM payment_requests WHERE user_id = ? AND status = 'pending'"
    ).get(userId);
    if (existing) {
      return res.status(400).json({ message: 'لديك طلب دفع قيد الانتظار بالفعل' });
    }

    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO payment_requests (id, user_id, user_name, user_code, status, requested_at) VALUES (?, ?, ?, ?, 'pending', ?)"
    ).run(`pr-${Date.now()}`, userId, user.name, user.subscriber_code || null, now);

    res.json({ success: true });
  } catch (err) {
    console.error('payment-request error:', err);
    res.status(500).json({ message: 'خطأ في الخادم، يرجى المحاولة مجدداً' });
  }
});

module.exports = router;

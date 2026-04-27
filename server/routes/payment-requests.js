const router = require('express').Router();
const dbMod = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Ensure table exists (safety net if migration didn't run)
function ensureTable(db) {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      user_name TEXT, user_code TEXT,
      status TEXT DEFAULT 'pending', requested_at TEXT NOT NULL
    )`);
  } catch (_) {}
}

// POST /api/payment-requests — member requests payment
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = dbMod.db;
    ensureTable(db);
    const userId = req.user.userId;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(401).json({ message: 'غير مصرح' });

    // Check if active (has order in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeOrder = db.prepare(
      `SELECT id FROM orders WHERE user_id = ? AND created_at > ? LIMIT 1`
    ).get(userId, thirtyDaysAgo);

    if (!activeOrder) {
      return res.status(400).json({ message: 'لا يمكن طلب الدفع لأنك غير نشطة. يجب تقديم طلب شراء خلال آخر 30 يوماً.' });
    }

    // Block duplicate pending request
    const existing = db.prepare(
      `SELECT id FROM payment_requests WHERE user_id = ? AND status = 'pending'`
    ).get(userId);
    if (existing) {
      return res.status(400).json({ message: 'لديك طلب دفع قيد الانتظار بالفعل' });
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO payment_requests (id, user_id, user_name, user_code, status, requested_at) VALUES (?, ?, ?, ?, 'pending', ?)`
    ).run(`pr-${Date.now()}`, userId, user.name, user.subscriber_code || null, now);

    res.json({ success: true });
  } catch (err) {
    console.error('payment-requests error:', err);
    res.status(500).json({ message: 'خطأ في الخادم، يرجى المحاولة مجدداً' });
  }
});

module.exports = router;

const router = require('express').Router();
const dbMod = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/verifications
router.post('/', authMiddleware, (req, res) => {
  const { idType, idNumber, fullName, dateOfBirth, phone, idImage } = req.body || {};
  const userId = req.user.userId;
  const db = dbMod.db;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  const existing = db.prepare('SELECT * FROM verifications WHERE user_id = ?').get(userId);
  if (existing?.status === 'approved') return res.status(400).json({ message: 'الحساب موثق بالفعل' });

  const now = new Date().toISOString();
  if (existing) {
    db.prepare(`UPDATE verifications SET id_type=?,id_number=?,full_name=?,date_of_birth=?,phone=?,id_image=?,status='pending',submitted_at=?,rejection_reason=NULL WHERE user_id=?`)
      .run(idType, idNumber, fullName, dateOfBirth, phone||null, idImage||null, now, userId);
  } else {
    db.prepare(`INSERT INTO verifications (id,user_id,user_name,user_code,id_type,id_number,full_name,date_of_birth,phone,id_image,status,submitted_at) VALUES (?,?,?,?,?,?,?,?,?,?,'pending',?)`)
      .run(`ver-${Date.now()}`, userId, user.name, user.subscriber_code||null, idType, idNumber, fullName, dateOfBirth, phone||null, idImage||null, now);
  }
  db.prepare("UPDATE users SET verification_status='pending' WHERE id=?").run(userId);
  res.json({ success: true });
});

// GET /api/verifications/status
router.get('/status', authMiddleware, (req, res) => {
  const user = dbMod.db.prepare('SELECT verification_status FROM users WHERE id = ?').get(req.user.userId);
  res.json({ status: user?.verification_status || 'none' });
});

module.exports = router;

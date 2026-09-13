const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require admin
router.use(authenticate, adminOnly);

// ─── Helper: Generate Promo Code ──────────────────────────────────────────────
function generatePromoCode(name) {
  // Extract letters only from first name, uppercase
  const firstName = name.split(' ')[0]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Z]/g, '')
    .substring(0, 6);

  if (!firstName || firstName.length < 2) {
    // Fallback: use timestamp
    return 'INF' + Date.now().toString().slice(-4);
  }

  const existingCodes = db
    .prepare('SELECT promo_code FROM users WHERE promo_code IS NOT NULL')
    .all()
    .map(r => r.promo_code);

  let code = firstName + '10';
  let counter = 2;
  while (existingCodes.includes(code)) {
    code = firstName.substring(0, 4) + counter + '10';
    counter++;
  }

  return code;
}

// ─── GET /api/influencers ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const influencers = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.phone, u.promo_code,
      u.discount_rate, u.commission_rate, u.is_active, u.created_at,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.order_value ELSE 0 END), 0) AS total_sales,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.commission_amount ELSE 0 END), 0) AS total_commission,
      COALESCE((SELECT SUM(cp.amount) FROM commission_payments cp WHERE cp.influencer_id = u.id), 0) AS paid_commission
    FROM users u
    LEFT JOIN orders o ON o.influencer_id = u.id
    WHERE u.role = 'influencer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  res.json(influencers);
});

// ─── POST /api/influencers ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  let { name, email, phone, password, discount_rate = 10, commission_rate = 10, promo_code } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }

  email = email.trim().toLowerCase();

  const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (emailExists) {
    return res.status(400).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
  }

  const finalCode = (promo_code || generatePromoCode(name)).toUpperCase().trim();

  const codeExists = db.prepare('SELECT id FROM users WHERE promo_code = ?').get(finalCode);
  if (codeExists) {
    return res.status(400).json({ error: 'البرومو كود مستخدم بالفعل، يرجى اختيار كود مختلف' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password, role, promo_code, discount_rate, commission_rate)
      VALUES (?, ?, ?, ?, 'influencer', ?, ?, ?)
    `).run(name, email, phone || null, hashedPassword, finalCode, Number(discount_rate), Number(commission_rate));

    const created = db.prepare(
      'SELECT id, name, email, phone, promo_code, discount_rate, commission_rate, is_active, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({ ...created, total_orders: 0, total_sales: 0, total_commission: 0, paid_commission: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الإنفلونسر' });
  }
});

// ─── PUT /api/influencers/:id ─────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, discount_rate, commission_rate, promo_code, is_active } = req.body;

  const influencer = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'influencer'").get(id);
  if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone;
  if (discount_rate !== undefined) updates.discount_rate = Number(discount_rate);
  if (commission_rate !== undefined) updates.commission_rate = Number(commission_rate);
  if (promo_code !== undefined) updates.promo_code = promo_code.toUpperCase().trim();
  if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
  if (password) updates.password = bcrypt.hashSync(password, 10);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
  }

  try {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), id);

    const updated = db.prepare(
      'SELECT id, name, email, phone, promo_code, discount_rate, commission_rate, is_active FROM users WHERE id = ?'
    ).get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء التحديث' });
  }
});

// ─── DELETE /api/influencers/:id ──────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const influencer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'influencer'").get(id);
  if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

  // Nullify their orders (don't delete them)
  db.prepare('UPDATE orders SET influencer_id = NULL WHERE influencer_id = ?').run(id);
  db.prepare('DELETE FROM commission_payments WHERE influencer_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  res.json({ message: 'تم حذف الإنفلونسر بنجاح' });
});

// ─── POST /api/influencers/:id/pay-commission ─────────────────────────────────
router.post('/:id/pay-commission', (req, res) => {
  const { id } = req.params;
  const { amount, notes } = req.body;

  const influencer = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'influencer'").get(id);
  if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح' });
  }

  db.prepare('INSERT INTO commission_payments (influencer_id, amount, notes) VALUES (?, ?, ?)').run(
    id, Number(amount), notes || null
  );

  res.json({ message: `تم تسجيل دفع ${amount} جنيه لـ ${influencer.name}` });
});

// ─── GET /api/influencers/:id/commission-history ──────────────────────────────
router.get('/:id/commission-history', (req, res) => {
  const { id } = req.params;
  const payments = db.prepare(
    'SELECT * FROM commission_payments WHERE influencer_id = ? ORDER BY paid_at DESC'
  ).all(id);
  res.json(payments);
});

module.exports = router;

const express = require('express');
const db = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Admin: all orders | Influencer: their own orders
router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    const orders = db.prepare(`
      SELECT o.*, u.name AS influencer_name
      FROM orders o
      LEFT JOIN users u ON o.influencer_id = u.id
      ORDER BY o.created_at DESC
    `).all();
    return res.json(orders);
  }

  // Influencer: only their orders (mask customer phone)
  const orders = db.prepare(`
    SELECT
      o.id,
      o.customer_name,
      CASE
        WHEN o.customer_phone IS NOT NULL
        THEN '****' || SUBSTR(o.customer_phone, -4)
        ELSE NULL
      END AS customer_phone,
      o.order_value,
      o.discount_amount,
      o.commission_amount,
      o.status,
      o.created_at
    FROM orders o
    WHERE o.influencer_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json(orders);
});

// ─── GET /api/orders/stats ────────────────────────────────────────────────────
router.get('/stats', authenticate, adminOnly, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status != 'cancelled'").get();
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(order_value), 0) AS total FROM orders WHERE status != 'cancelled'").get();
  const pendingOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'").get();
  const totalCommission = db.prepare("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM orders WHERE status != 'cancelled'").get();
  const paidCommission = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM commission_payments').get();
  const totalInfluencers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'influencer' AND is_active = 1").get();

  const topInfluencer = db.prepare(`
    SELECT u.name, u.promo_code,
           COUNT(o.id) AS order_count,
           COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.order_value ELSE 0 END), 0) AS total_sales
    FROM users u
    LEFT JOIN orders o ON o.influencer_id = u.id
    WHERE u.role = 'influencer'
    GROUP BY u.id
    ORDER BY total_sales DESC
    LIMIT 1
  `).get();

  const recentOrders = db.prepare(`
    SELECT o.*, u.name AS influencer_name
    FROM orders o
    LEFT JOIN users u ON o.influencer_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    totalOrders: totalOrders.count,
    totalRevenue: totalRevenue.total,
    pendingOrders: pendingOrders.count,
    totalCommission: totalCommission.total,
    paidCommission: paidCommission.total,
    pendingCommission: totalCommission.total - paidCommission.total,
    totalInfluencers: totalInfluencers.count,
    topInfluencer,
    recentOrders,
  });
});

// ─── GET /api/orders/my-stats ─────────────────────────────────────────────────
router.get('/my-stats', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'غير مسموح' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const totalOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE influencer_id = ? AND status != 'cancelled'").get(req.user.id);
  const totalSales = db.prepare("SELECT COALESCE(SUM(order_value), 0) AS total FROM orders WHERE influencer_id = ? AND status != 'cancelled'").get(req.user.id);
  const totalCommission = db.prepare("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM orders WHERE influencer_id = ? AND status != 'cancelled'").get(req.user.id);
  const paidCommission = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM commission_payments WHERE influencer_id = ?').get(req.user.id);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      promo_code: user.promo_code,
      discount_rate: user.discount_rate,
      commission_rate: user.commission_rate,
    },
    totalOrders: totalOrders.count,
    totalSales: totalSales.total,
    totalCommission: totalCommission.total,
    paidCommission: paidCommission.total,
    pendingCommission: totalCommission.total - paidCommission.total,
  });
});

// ─── POST /api/orders/validate-promo ─────────────────────────────────────────
router.post('/validate-promo', authenticate, adminOnly, (req, res) => {
  const { promo_code } = req.body;
  if (!promo_code) return res.status(400).json({ error: 'يرجى إدخال البرومو كود' });

  const influencer = db.prepare(`
    SELECT id, name, promo_code, discount_rate, commission_rate
    FROM users WHERE promo_code = ? AND role = 'influencer' AND is_active = 1
  `).get(promo_code.toUpperCase().trim());

  if (!influencer) {
    return res.status(404).json({ valid: false, error: 'البرومو كود غير صحيح أو غير نشط' });
  }

  res.json({ valid: true, influencer });
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
router.post('/', authenticate, adminOnly, (req, res) => {
  const { customer_name, customer_phone, order_value, promo_code, notes } = req.body;

  if (!customer_name || !order_value) {
    return res.status(400).json({ error: 'اسم العميل وقيمة الأوردر مطلوبة' });
  }

  const value = Number(order_value);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'قيمة الأوردر غير صحيحة' });
  }

  let influencer = null;
  let discount_amount = 0;
  let commission_amount = 0;
  let finalCode = null;

  if (promo_code && promo_code.trim()) {
    finalCode = promo_code.toUpperCase().trim();
    influencer = db.prepare(`
      SELECT * FROM users WHERE promo_code = ? AND role = 'influencer' AND is_active = 1
    `).get(finalCode);

    if (!influencer) {
      return res.status(400).json({ error: 'البرومو كود غير صحيح أو غير نشط' });
    }

    discount_amount = (value * influencer.discount_rate) / 100;
    commission_amount = (value * influencer.commission_rate) / 100;
  }

  try {
    const result = db.prepare(`
      INSERT INTO orders (customer_name, customer_phone, order_value, promo_code, influencer_id, discount_amount, commission_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_name.trim(),
      customer_phone || null,
      value,
      finalCode,
      influencer ? influencer.id : null,
      discount_amount,
      commission_amount,
      notes || null
    );

    const newOrder = db.prepare(`
      SELECT o.*, u.name AS influencer_name
      FROM orders o LEFT JOIN users u ON o.influencer_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الأوردر' });
  }
});

// ─── PUT /api/orders/:id ──────────────────────────────────────────────────────
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'الأوردر غير موجود' });

  const validStatuses = ['pending', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'حالة الأوردر غير صحيحة' });
  }

  const updates = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE orders SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), id);

  const updated = db.prepare(`
    SELECT o.*, u.name AS influencer_name
    FROM orders o LEFT JOIN users u ON o.influencer_id = u.id
    WHERE o.id = ?
  `).get(id);

  res.json(updated);
});

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────────
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'الأوردر غير موجود' });

  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ message: 'تم حذف الأوردر بنجاح' });
});

module.exports = router;

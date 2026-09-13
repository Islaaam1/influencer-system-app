const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني/اسم المستخدم وكلمة المرور' });
  }

  const identifier = email.trim();
  const user = db.prepare('SELECT * FROM users WHERE (email = ? OR name = ?) AND is_active = 1').get(identifier.toLowerCase(), identifier);

  if (!user) {
    return res.status(401).json({ error: 'البيانات المدخلة غير صحيحة' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'البيانات المدخلة غير صحيحة' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      promo_code: user.promo_code,
      discount_rate: user.discount_rate,
      commission_rate: user.commission_rate,
    }
  });
});

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.schema');
const { JWT_SECRET } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني/اسم المستخدم وكلمة المرور' });
    }

    const identifier = email.trim();
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { name: identifier }],
      is_active: true,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'البيانات المدخلة غير صحيحة' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        promo_code: user.promo_code,
        discount_rate: user.discount_rate,
        commission_rate: user.commission_rate,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login };

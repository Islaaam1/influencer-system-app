const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'influencer_secret_key';

/**
 * Verify JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
};

/**
 * Admin-only middleware (must be used after authenticate)
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'هذا الإجراء للمدير فقط' });
  }
  next();
};

module.exports = { authenticate, adminOnly, JWT_SECRET };

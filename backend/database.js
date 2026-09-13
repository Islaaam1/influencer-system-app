const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Create/connect to SQLite database
const db = new Database(path.join(__dirname, 'influencer_system.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Create Tables ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'influencer',
    promo_code TEXT UNIQUE,
    discount_rate REAL DEFAULT 10,
    commission_rate REAL DEFAULT 10,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_value REAL NOT NULL,
    promo_code TEXT,
    influencer_id INTEGER,
    discount_amount REAL DEFAULT 0,
    commission_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (influencer_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS commission_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    influencer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (influencer_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ─── Seed Admin User ──────────────────────────────────────────────────────────
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, promo_code)
    VALUES (?, ?, ?, 'admin', NULL)
  `).run('المدير', 'admin@system.com', hashedPassword);
  console.log('✅ Admin created → admin@system.com / admin123');
}

module.exports = db;

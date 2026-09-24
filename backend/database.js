const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/user.schema');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/influencer_system';

async function seedAdmin() {
  const adminExists = await User.exists({ role: 'admin' });
  if (adminExists) return;

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'المدير',
    email: 'admin@system.com',
    password: hashedPassword,
    role: 'admin',
  });

  console.log(' Admin created → admin@system.com / admin123');
}

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log(` MongoDB connected: ${mongoose.connection.name}`);
  await seedAdmin();
}

module.exports = { connectDatabase };

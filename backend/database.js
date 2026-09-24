const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/user.schema');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/influencer_system';
const DEFAULT_ADMIN_PASSWORD = 'Lunahealthy@@99xx';

async function seedAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const admin = await User.findOne({ role: 'admin' });

  if (admin) {
    const passwordIsCurrent = await bcrypt.compare(adminPassword, admin.password);
    if (!passwordIsCurrent) {
      admin.password = await bcrypt.hash(adminPassword, 10);
      await admin.save();
      console.log('Admin password updated');
    }
    return;
  }

  await User.create({
    name: 'المدير',
    email: 'admin@system.com',
    password: await bcrypt.hash(adminPassword, 10),
    role: 'admin',
  });

  console.log('Admin account created');
}

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  await seedAdmin();
}

module.exports = { connectDatabase };

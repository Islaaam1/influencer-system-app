require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { connectDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const influencerRoutes = require('./routes/influencers');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Influencer System API is running' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

app.use(express.static(frontendDistPath));
app.get('*', (req, res, next) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, req, res, next) => {
  console.error(error.stack);
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'البيانات المدخلة غير صحيحة' });
  }
  return res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function shutdown() {
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

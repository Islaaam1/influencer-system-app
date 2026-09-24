const express = require('express');
const {
  getOrders,
  getAdminStats,
  getInfluencerStats,
  validatePromoCode,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/order.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getOrders);
router.get('/stats', authenticate, adminOnly, getAdminStats);
router.get('/my-stats', authenticate, getInfluencerStats);
router.post('/validate-promo', authenticate, adminOnly, validatePromoCode);
router.post('/', authenticate, adminOnly, createOrder);
router.put('/:id', authenticate, adminOnly, updateOrder);
router.delete('/:id', authenticate, adminOnly, deleteOrder);

module.exports = router;

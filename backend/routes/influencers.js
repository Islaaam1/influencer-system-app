const express = require('express');
const {
  getInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  payCommission,
  getCommissionHistory,
} = require('../controllers/influencer.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, adminOnly);

router.get('/', getInfluencers);
router.post('/', createInfluencer);
router.put('/:id', updateInfluencer);
router.delete('/:id', deleteInfluencer);
router.post('/:id/pay-commission', payCommission);
router.get('/:id/commission-history', getCommissionHistory);

module.exports = router;

const express = require('express');
const { query } = require('express-validator');
const {
  getAvailableSlots,
  getBusinessHours,
  updateBusinessHours,
  getAvailabilityBlocks,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get(
  '/slots',
  [
    query('date').notEmpty().withMessage('Date is required'),
    query('duration').isInt({ min: 30, max: 90 }).withMessage('Duration must be 30, 60, or 90'),
    validate,
  ],
  getAvailableSlots
);

router.get('/business-hours', getBusinessHours);

// Admin routes (protected)
router.put(
  '/admin/business-hours/:dayOfWeek',
  protect,
  updateBusinessHours
);

router.get('/admin/blocks', protect, getAvailabilityBlocks);
router.post('/admin/blocks', protect, createAvailabilityBlock);
router.delete('/admin/blocks/:id', protect, deleteAvailabilityBlock);

module.exports = router;

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getServiceTypes,
  createBooking,
  getBookingById,
} = require('../controllers/bookingController');
const { validate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/bookings/service-types
// @desc    Get all active service types
// @access  Public
router.get('/service-types', getServiceTypes);

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Public
router.post(
  '/',
  [
    body('serviceTypeId').isInt({ min: 1 }).withMessage('Valid service type ID is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('customer.firstName').trim().notEmpty().withMessage('First name is required'),
    body('customer.lastName').trim().notEmpty().withMessage('Last name is required'),
    body('customer.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('customer.phone').trim().notEmpty().withMessage('Phone number is required'),
    body('customer.notes').optional().trim(),
    validate,
  ],
  createBooking
);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Public
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid booking ID is required'),
    validate,
  ],
  getBookingById
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const { login, refresh, getMe } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/admin/auth/login
router.post(
  '/auth/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// @route   POST /api/admin/auth/refresh
router.post(
  '/auth/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate,
  ],
  refresh
);

// @route   GET /api/admin/auth/me
router.get('/auth/me', protect, getMe);

module.exports = router;

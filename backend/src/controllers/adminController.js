const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Generate JWT token
const generateToken = (adminId, email) => {
  return jwt.sign(
    { id: adminId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

// Generate refresh token
const generateRefreshToken = (adminId, email) => {
  return jwt.sign(
    { id: adminId, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide email and password' },
      });
    }

    // Find admin by email (MySQL syntax with ?)
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    const admin = rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    // Update last login time
    await pool.query(
      'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    // Generate tokens
    const accessToken = generateToken(admin.id, admin.email);
    const refreshToken = generateRefreshToken(admin.id, admin.email);

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.first_name,
          lastName: admin.last_name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/admin/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required' },
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if admin still exists and is active
      const [rows] = await pool.query(
        'SELECT id, email FROM admins WHERE id = ? AND is_active = TRUE',
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: { message: 'Admin not found or inactive' },
        });
      }

      const admin = rows[0];

      // Generate new access token
      const accessToken = generateToken(admin.id, admin.email);

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired refresh token' },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, first_name, last_name, last_login_at FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Admin not found' },
      });
    }

    const admin = rows[0];

    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        lastLoginAt: admin.last_login_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  getMe,
};

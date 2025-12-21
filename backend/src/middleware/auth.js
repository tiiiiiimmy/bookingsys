const jwt = require('jsonwebtoken');
require('dotenv').config();

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized to access this route' },
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded; // Add admin data to request
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token is invalid or expired' },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };

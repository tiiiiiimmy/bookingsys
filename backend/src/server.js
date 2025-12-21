const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const pool = require('./config/database');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// API routes
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/availability', require('./routes/availability.routes'));
// app.use('/api/bookings', require('./routes/booking.routes'));

// Stripe webhook route (must be before body parser)
// app.use('/api/webhooks/stripe', require('./routes/webhook.routes'));

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection (MySQL)
    const connection = await pool.getConnection();
    await connection.query('SELECT NOW()');
    connection.release();
    console.log('✓ MySQL database connection successful');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

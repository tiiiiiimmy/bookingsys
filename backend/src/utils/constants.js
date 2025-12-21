// Booking status
const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

// Availability block types
const BLOCK_TYPE = {
  BLOCKED: 'blocked',
  AVAILABLE_OVERRIDE: 'available_override',
};

// Service durations (in minutes)
const SERVICE_DURATIONS = {
  SHORT: 30,
  STANDARD: 60,
  EXTENDED: 90,
};

// Pricing (in cents)
const SERVICE_PRICING = {
  30: 5000,  // $50
  60: 9000,  // $90
  90: 13000, // $130
};

// Business hours (day of week: 0 = Sunday, 4 = Thursday)
const BUSINESS_DAYS = {
  SUNDAY: 0,
  THURSDAY: 4,
};

// Default business hours
const DEFAULT_BUSINESS_HOURS = {
  start: '09:00',
  end: '17:00', // 5:00 PM
};

// Booking configuration
const BOOKING_CONFIG = {
  BUFFER_MINUTES: 15, // Buffer time between appointments
  PENDING_EXPIRY_MINUTES: 15, // Time before pending booking expires
};

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  BLOCK_TYPE,
  SERVICE_DURATIONS,
  SERVICE_PRICING,
  BUSINESS_DAYS,
  DEFAULT_BUSINESS_HOURS,
  BOOKING_CONFIG,
};

const pool = require('../config/database');
const { BOOKING_CONFIG } = require('../utils/constants');

/**
 * Get business hours for a specific day of week
 * @param {number} dayOfWeek - 0 (Sunday) to 6 (Saturday)
 * @returns {Object|null} Business hours or null if closed
 */
const getBusinessHoursForDay = async (dayOfWeek) => {
  const [rows] = await pool.query(
    'SELECT * FROM business_hours WHERE day_of_week = ? AND is_active = TRUE',
    [dayOfWeek]
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get all blocked periods for a specific date
 * @param {Date} date - The date to check
 * @returns {Array} Array of blocked periods
 */
const getBlockedPeriodsForDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [rows] = await pool.query(
    `SELECT * FROM availability_blocks
     WHERE block_type = 'blocked'
     AND (
       (start_time >= ? AND start_time <= ?) OR
       (end_time >= ? AND end_time <= ?) OR
       (start_time <= ? AND end_time >= ?)
     )`,
    [startOfDay, endOfDay, startOfDay, endOfDay, startOfDay, endOfDay]
  );

  return rows;
};

/**
 * Get all bookings for a specific date
 * @param {Date} date - The date to check
 * @returns {Array} Array of bookings
 */
const getBookingsForDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [rows] = await pool.query(
    `SELECT * FROM bookings
     WHERE status IN ('confirmed', 'pending_payment')
     AND start_time >= ? AND start_time <= ?
     ORDER BY start_time`,
    [startOfDay, endOfDay]
  );

  return rows;
};

/**
 * Generate all possible time slots within business hours
 * @param {string} startTime - Business start time (HH:MM format)
 * @param {string} endTime - Business end time (HH:MM format)
 * @param {Date} date - The date
 * @param {number} durationMinutes - Duration of each slot
 * @returns {Array} Array of time slot objects
 */
const generateTimeSlots = (startTime, endTime, date, durationMinutes) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const currentSlot = new Date(date);
  currentSlot.setHours(startHour, startMin, 0, 0);

  const businessEnd = new Date(date);
  businessEnd.setHours(endHour, endMin, 0, 0);

  const bufferMinutes = BOOKING_CONFIG.BUFFER_MINUTES;

  while (currentSlot < businessEnd) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);

    // Check if slot end (plus buffer) fits within business hours
    const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferMinutes * 60000);

    if (slotEndWithBuffer <= businessEnd) {
      slots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
      });
    }

    // Move to next slot (current slot end + buffer)
    currentSlot.setTime(slotEnd.getTime() + bufferMinutes * 60000);
  }

  return slots;
};

/**
 * Check if a time slot conflicts with existing bookings or blocks
 * @param {Date} slotStart
 * @param {Date} slotEnd
 * @param {Array} bookings
 * @param {Array} blocks
 * @returns {boolean} True if there's a conflict
 */
const hasConflict = (slotStart, slotEnd, bookings, blocks) => {
  // Check bookings
  for (const booking of bookings) {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    if (
      (slotStart >= bookingStart && slotStart < bookingEnd) ||
      (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
      (slotStart <= bookingStart && slotEnd >= bookingEnd)
    ) {
      return true;
    }
  }

  // Check blocks
  for (const block of blocks) {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    if (
      (slotStart >= blockStart && slotStart < blockEnd) ||
      (slotEnd > blockStart && slotEnd <= blockEnd) ||
      (slotStart <= blockStart && slotEnd >= blockEnd)
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Get available time slots for a specific date and duration
 * @param {Date} date - The date to check
 * @param {number} durationMinutes - Duration in minutes (30, 60, or 90)
 * @returns {Array} Array of available time slots
 */
const getAvailableSlots = async (date, durationMinutes) => {
  // Validate duration
  if (![30, 60, 90].includes(durationMinutes)) {
    throw new Error('Invalid duration. Must be 30, 60, or 90 minutes.');
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Get business hours for this day
  const businessHours = await getBusinessHoursForDay(dayOfWeek);

  // If not a business day, return empty array
  if (!businessHours) {
    return [];
  }

  // Get blocked periods and existing bookings
  const [blockedPeriods, existingBookings] = await Promise.all([
    getBlockedPeriodsForDate(date),
    getBookingsForDate(date),
  ]);

  // Generate all possible slots
  const allSlots = generateTimeSlots(
    businessHours.start_time,
    businessHours.end_time,
    date,
    durationMinutes
  );

  // Filter out conflicting slots
  const availableSlots = allSlots.filter(slot =>
    !hasConflict(slot.start, slot.end, existingBookings, blockedPeriods)
  );

  return availableSlots.map(slot => ({
    startTime: slot.start,
    endTime: slot.end,
    available: true,
  }));
};

/**
 * Check if a specific time slot is available
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {boolean} True if available
 */
const isSlotAvailable = async (startTime, endTime) => {
  const date = new Date(startTime);
  const dayOfWeek = date.getDay();

  // Check business hours
  const businessHours = await getBusinessHoursForDay(dayOfWeek);
  if (!businessHours) {
    return false;
  }

  // Check if slot is within business hours
  const [startHour, startMin] = businessHours.start_time.split(':').map(Number);
  const [endHour, endMin] = businessHours.end_time.split(':').map(Number);

  const businessStart = new Date(date);
  businessStart.setHours(startHour, startMin, 0, 0);

  const businessEnd = new Date(date);
  businessEnd.setHours(endHour, endMin, 0, 0);

  if (startTime < businessStart || endTime > businessEnd) {
    return false;
  }

  // Check for conflicts
  const [blockedPeriods, existingBookings] = await Promise.all([
    getBlockedPeriodsForDate(date),
    getBookingsForDate(date),
  ]);

  return !hasConflict(startTime, endTime, existingBookings, blockedPeriods);
};

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  getBusinessHoursForDay,
};

const pool = require('../config/database');
const availabilityService = require('./availabilityService');

/**
 * Create a new booking
 * @param {Object} bookingData - { serviceTypeId, startTime, endTime, customerData }
 * @returns {Promise<Object>} Created booking
 */
const createBooking = async (bookingData) => {
  const { serviceTypeId, startTime, endTime, customerData } = bookingData;
  const { firstName, lastName, email, phone, notes } = customerData;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Validate service type exists and get duration
    const [serviceTypes] = await connection.query(
      'SELECT * FROM service_types WHERE id = ? AND is_active = TRUE',
      [serviceTypeId]
    );

    if (serviceTypes.length === 0) {
      throw new Error('Invalid service type');
    }

    const serviceType = serviceTypes[0];
    const requestedDate = new Date(startTime);

    // 2. Verify the slot is still available
    const slots = await availabilityService.getAvailableSlots(
      requestedDate,
      serviceType.duration_minutes
    );

    const requestedSlot = slots.find(
      slot => new Date(slot.startTime).getTime() === new Date(startTime).getTime()
    );

    if (!requestedSlot || !requestedSlot.available) {
      throw new Error('Selected time slot is no longer available');
    }

    // 3. Check for overlapping bookings (extra safety check)
    const [overlapping] = await connection.query(
      `SELECT id FROM bookings
       WHERE status NOT IN ('cancelled', 'no_show')
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (start_time >= ? AND end_time <= ?)
       )`,
      [startTime, startTime, endTime, endTime, startTime, endTime]
    );

    if (overlapping.length > 0) {
      throw new Error('Time slot conflicts with existing booking');
    }

    // 4. Find or create customer
    let customerId;
    const [existingCustomers] = await connection.query(
      'SELECT id FROM customers WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingCustomers.length > 0) {
      // Update existing customer info
      customerId = existingCustomers[0].id;
      await connection.query(
        `UPDATE customers
         SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [firstName, lastName, phone, customerId]
      );
    } else {
      // Create new customer
      const [customerResult] = await connection.query(
        `INSERT INTO customers (first_name, last_name, email, phone)
         VALUES (?, ?, ?, ?)`,
        [firstName, lastName, email.toLowerCase(), phone]
      );
      customerId = customerResult.insertId;
    }

    // 5. Create booking
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings
       (customer_id, service_type_id, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [customerId, serviceTypeId, startTime, endTime, notes || null]
    );

    await connection.commit();

    // 6. Fetch and return complete booking info
    const [bookings] = await connection.query(
      `SELECT
         b.id, b.start_time, b.end_time, b.status, b.notes, b.created_at,
         c.id as customer_id, c.first_name, c.last_name, c.email, c.phone,
         s.id as service_id, s.name_zh as service_name, s.duration_minutes,
         ROUND(s.price_cents / 100, 2) as price
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN service_types s ON b.service_type_id = s.id
       WHERE b.id = ?`,
      [bookingResult.insertId]
    );

    return bookings[0];

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get booking by ID
 * @param {number} bookingId
 * @returns {Promise<Object|null>}
 */
const getBookingById = async (bookingId) => {
  const [bookings] = await pool.query(
    `SELECT
       b.id, b.start_time, b.end_time, b.status, b.notes, b.created_at, b.updated_at,
       c.id as customer_id, c.first_name, c.last_name, c.email, c.phone,
       s.id as service_id, s.name_zh as service_name, s.duration_minutes,
       ROUND(s.price_cents / 100, 2) as price,
       p.id as payment_id, p.stripe_payment_intent_id, p.amount, p.status as payment_status
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN service_types s ON b.service_type_id = s.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.id = ?`,
    [bookingId]
  );

  return bookings.length > 0 ? bookings[0] : null;
};

/**
 * Get all service types
 * @returns {Promise<Array>}
 */
const getServiceTypes = async () => {
  const [serviceTypes] = await pool.query(
    `SELECT
       id, duration_minutes, name, name_zh, description, is_active,
       ROUND(price_cents / 100, 2) as price,
       price_cents,
       created_at, updated_at
     FROM service_types
     WHERE is_active = TRUE
     ORDER BY duration_minutes ASC`
  );
  return serviceTypes;
};

module.exports = {
  createBooking,
  getBookingById,
  getServiceTypes,
};

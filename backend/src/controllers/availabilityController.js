const availabilityService = require('../services/availabilityService');
const pool = require('../config/database');

// @desc    Get available slots for a date and duration
// @route   GET /api/availability/slots?date=YYYY-MM-DD&duration=60
// @access  Public
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date, duration } = req.query;

    if (!date || !duration) {
      return res.status(400).json({
        success: false,
        error: { message: 'Date and duration are required' },
      });
    }

    const requestedDate = new Date(date);
    const durationMinutes = parseInt(duration);

    // Validate date
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid date format. Use YYYY-MM-DD' },
      });
    }

    // Don't allow booking in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot book appointments in the past' },
      });
    }

    const slots = await availabilityService.getAvailableSlots(
      requestedDate,
      durationMinutes
    );

    res.json({
      success: true,
      data: {
        date,
        duration: durationMinutes,
        dayOfWeek: requestedDate.getDay(),
        slots,
        totalSlots: slots.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all business hours
// @route   GET /api/availability/business-hours
// @access  Public
const getBusinessHours = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM business_hours ORDER BY day_of_week'
    );

    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        dayOfWeek: row.day_of_week,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business hours for a specific day
// @route   PUT /api/admin/availability/business-hours/:dayOfWeek
// @access  Private (Admin)
const updateBusinessHours = async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;
    const { startTime, endTime, isActive } = req.body;

    const day = parseInt(dayOfWeek);

    if (day < 0 || day > 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid day of week. Must be 0-6' },
      });
    }

    await pool.query(
      `UPDATE business_hours
       SET start_time = ?, end_time = ?, is_active = ?
       WHERE day_of_week = ?`,
      [startTime, endTime, isActive, day]
    );

    const [rows] = await pool.query(
      'SELECT * FROM business_hours WHERE day_of_week = ?',
      [day]
    );

    res.json({
      success: true,
      data: rows[0],
      message: 'Business hours updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all availability blocks
// @route   GET /api/admin/availability/blocks
// @access  Private (Admin)
const getAvailabilityBlocks = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM availability_blocks';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE start_time >= ? AND end_time <= ?';
      params.push(new Date(startDate), new Date(endDate));
    }

    query += ' ORDER BY start_time';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        blockType: row.block_type,
        reason: row.reason,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create availability block
// @route   POST /api/admin/availability/blocks
// @access  Private (Admin)
const createAvailabilityBlock = async (req, res, next) => {
  try {
    const { startTime, endTime, blockType, reason } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: { message: 'Start time and end time are required' },
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: { message: 'End time must be after start time' },
      });
    }

    const [result] = await pool.query(
      `INSERT INTO availability_blocks (start_time, end_time, block_type, reason)
       VALUES (?, ?, ?, ?)`,
      [start, end, blockType || 'blocked', reason || null]
    );

    const [rows] = await pool.query(
      'SELECT * FROM availability_blocks WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Availability block created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete availability block
// @route   DELETE /api/admin/availability/blocks/:id
// @access  Private (Admin)
const deleteAvailabilityBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM availability_blocks WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Availability block not found' },
      });
    }

    res.json({
      success: true,
      message: 'Availability block deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  getBusinessHours,
  updateBusinessHours,
  getAvailabilityBlocks,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
};

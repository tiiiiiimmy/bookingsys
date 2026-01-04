const bookingService = require('../services/bookingService');

/**
 * @desc    Get all service types
 * @route   GET /api/bookings/service-types
 * @access  Public
 */
const getServiceTypes = async (req, res, next) => {
  try {
    const serviceTypes = await bookingService.getServiceTypes();

    res.json({
      success: true,
      data: serviceTypes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Public
 */
const createBooking = async (req, res, next) => {
  try {
    const { serviceTypeId, startTime, endTime, customer } = req.body;

    // Validate required fields
    if (!serviceTypeId || !startTime || !endTime || !customer) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Customer information is incomplete' },
      });
    }

    // Create booking
    const booking = await bookingService.createBooking({
      serviceTypeId,
      startTime,
      endTime,
      customerData: customer,
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    if (error.message.includes('no longer available') ||
        error.message.includes('conflicts with existing')) {
      return res.status(409).json({
        success: false,
        error: { message: error.message },
      });
    }

    if (error.message.includes('Invalid service type')) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }

    next(error);
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Public
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServiceTypes,
  createBooking,
  getBookingById,
};

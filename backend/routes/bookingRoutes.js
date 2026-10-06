const express = require('express')
const router = express.Router()
const {
  createBooking,
  getBookingQuote,
  getBookingById,
  getBookingTimeline,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  markReadyBooking,
  pickupBooking,
  activateBooking,
  requestReturnBooking,
  confirmReturnBooking,
  completeBooking
} = require('../controllers/bookingController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// POST /api/bookings/quote - Server-side read-only price quote calculation
router.post('/quote', requireAuth, getBookingQuote)

// POST /api/bookings - Only authenticated FARMER can create bookings
router.post('/', requireAuth, requireRole('FARMER'), createBooking)

// GET /api/bookings/my - Authenticated farmer views their own bookings
router.get('/my', requireAuth, requireRole('FARMER'), getMyBookings)

// GET /api/bookings/owner - Authenticated owner views bookings for their equipment
router.get('/owner', requireAuth, requireRole('OWNER'), getOwnerBookings)

// GET /api/bookings/:id/timeline - Booking participant views lifecycle history
router.get('/:id/timeline', requireAuth, getBookingTimeline)

// GET /api/bookings/:id - Booking participant views single booking details
router.get('/:id', requireAuth, getBookingById)

// Generic status transition endpoint (enforces state machine & ownership)
router.patch('/:id/status', requireAuth, updateBookingStatus)

// Dedicated lifecycle endpoints (OWNER actions)
router.patch('/:id/confirm', requireAuth, requireRole('OWNER'), confirmBooking)
router.patch('/:id/reject', requireAuth, requireRole('OWNER'), rejectBooking)
router.patch('/:id/ready', requireAuth, requireRole('OWNER'), markReadyBooking)
router.patch('/:id/confirm-return', requireAuth, requireRole('OWNER'), confirmReturnBooking)
router.patch('/:id/complete', requireAuth, requireRole('OWNER'), completeBooking)

// Dedicated lifecycle endpoints (Cancellation before handover: FARMER or OWNER)
router.patch('/:id/cancel', requireAuth, requireRole('FARMER', 'OWNER'), cancelBooking)

// Dedicated lifecycle endpoints (FARMER actions)
router.patch('/:id/pickup', requireAuth, requireRole('FARMER'), pickupBooking)
router.patch('/:id/request-return', requireAuth, requireRole('FARMER'), requestReturnBooking)

// Rental activation endpoint (PICKED_UP -> ACTIVE) - sealed to enforce two-party receipt
router.patch('/:id/activate', requireAuth, activateBooking)

module.exports = router

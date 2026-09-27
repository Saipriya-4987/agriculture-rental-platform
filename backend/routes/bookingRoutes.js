const express = require('express')
const router = express.Router()
const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  activateBooking,
  completeBooking
} = require('../controllers/bookingController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// POST /api/bookings - Only authenticated FARMER can create bookings
router.post('/', requireAuth, requireRole('FARMER'), createBooking)

// GET /api/bookings/my - Authenticated farmer views their own bookings
router.get('/my', requireAuth, getMyBookings)

// GET /api/bookings/owner - Authenticated owner views bookings for their equipment
router.get('/owner', requireAuth, requireRole('OWNER'), getOwnerBookings)

// PATCH /api/bookings/:id/status - Status transitions with ownership enforcement
router.patch('/:id/status', requireAuth, updateBookingStatus)

// Convenience transition endpoints
router.patch('/:id/confirm', requireAuth, requireRole('OWNER'), confirmBooking)
router.patch('/:id/reject', requireAuth, requireRole('OWNER'), rejectBooking)
router.patch('/:id/cancel', requireAuth, requireRole('FARMER'), cancelBooking)
router.patch('/:id/activate', requireAuth, activateBooking)
router.patch('/:id/complete', requireAuth, completeBooking)

module.exports = router

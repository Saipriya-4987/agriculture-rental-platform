const express = require('express')
const router = express.Router()
const { createBooking, getMyBookings } = require('../controllers/bookingController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// POST /api/bookings - Only authenticated FARMER can create bookings
router.post('/', requireAuth, requireRole('FARMER'), createBooking)

// GET /api/bookings/my - Authenticated user can view their bookings
router.get('/my', requireAuth, getMyBookings)

module.exports = router

const express = require('express')
const router = express.Router()
const { createReview } = require('../controllers/reviewController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// POST /api/reviews - Authenticated FARMER creates review for completed booking
router.post('/', requireAuth, requireRole('FARMER'), createReview)

module.exports = router

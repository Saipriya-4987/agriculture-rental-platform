const prisma = require('../prisma/client')

// Custom error class for API errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

/**
 * Format Prisma review model to safe JSON output.
 */
const formatReview = (review) => {
  if (!review) return null
  return {
    id: review.id,
    bookingId: review.booking_id,
    reviewerId: review.reviewer_id,
    equipmentId: review.equipment_id,
    rating: Number(review.rating),
    comment: review.comment || null,
    createdAt: review.created_at,
    reviewer: review.reviewer ? {
      id: review.reviewer.id,
      name: review.reviewer.name
    } : undefined
  }
}

/**
 * Create a new review for a completed rental.
 * POST /api/reviews
 * Protected: Requires authentication + FARMER role.
 */
const createReview = async (req, res, next) => {
  try {
    const { bookingId, booking_id, rating, comment } = req.body || {}

    // 1. Validate booking ID
    const rawBookingId = bookingId !== undefined ? bookingId : booking_id
    const parsedBookingId = parseInt(rawBookingId, 10)
    if (isNaN(parsedBookingId)) {
      throw new AppError('Valid bookingId is required', 400)
    }

    // 2. Validate rating (1 to 5 integer)
    if (rating === undefined || rating === null) {
      throw new AppError('Rating is required', 400)
    }
    const numRating = Number(rating)
    if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5', 400)
    }

    // 3. Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: parsedBookingId },
      include: { equipment: true }
    })

    if (!booking) {
      throw new AppError('Booking not found', 404)
    }

    // 4. Farmer authorization: only the farmer who made the booking can review
    if (req.user.role !== 'FARMER' || booking.farmer_id !== req.user.id) {
      throw new AppError('Forbidden: Only the farmer who made this booking can submit a review', 403)
    }

    // 5. Booking must be COMPLETED
    if (booking.status !== 'COMPLETED') {
      throw new AppError(`Only completed bookings can be reviewed. Current status: ${booking.status}`, 400)
    }

    // 6. Prevent duplicate reviews for the same booking
    const existingReview = await prisma.review.findFirst({
      where: { booking_id: booking.id }
    })
    if (existingReview) {
      throw new AppError('A review has already been submitted for this booking', 409)
    }

    // 7. Sanitize optional comment
    const cleanComment = typeof comment === 'string' && comment.trim().length > 0 ? comment.trim() : null

    // 8. Create review (derive reviewer_id from req.user.id, equipment_id from booking)
    const newReview = await prisma.review.create({
      data: {
        booking_id: booking.id,
        reviewer_id: req.user.id,
        equipment_id: booking.equipment_id,
        rating: numRating,
        comment: cleanComment
      },
      include: {
        reviewer: {
          select: { id: true, name: true }
        }
      }
    })

    // 9. Consistently recalculate equipment rating and rating_count
    const stats = await prisma.review.aggregate({
      where: { equipment_id: booking.equipment_id },
      _avg: { rating: true },
      _count: { rating: true }
    })

    const avgRating = stats._avg.rating !== null ? Number(Number(stats._avg.rating).toFixed(2)) : 0
    const ratingCount = stats._count.rating || 0

    await prisma.equipment.update({
      where: { id: booking.equipment_id },
      data: {
        rating: avgRating,
        rating_count: ratingCount
      }
    })

    res.status(201).json({
      message: 'Review submitted successfully',
      review: formatReview(newReview)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get all reviews for a specific equipment item.
 * GET /api/equipment/:id/reviews
 * Public endpoint.
 */
const getEquipmentReviews = async (req, res, next) => {
  try {
    const equipmentId = parseInt(req.params.id, 10)
    if (isNaN(equipmentId)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    // Verify equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    })

    if (!equipment) {
      throw new AppError('Equipment not found', 404)
    }

    const reviews = await prisma.review.findMany({
      where: { equipment_id: equipmentId },
      include: {
        reviewer: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    res.json(reviews.map(formatReview))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createReview,
  getEquipmentReviews,
  formatReview
}

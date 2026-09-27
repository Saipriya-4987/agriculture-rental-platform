const prisma = require('../prisma/client')

// Custom error class for API errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

// Helper to format Prisma booking model to safe client JSON
const formatBooking = (booking) => {
  if (!booking) return null
  return {
    id: booking.id,
    equipmentId: booking.equipment_id,
    equipment_id: booking.equipment_id,
    farmerId: booking.farmer_id,
    farmer_id: booking.farmer_id,
    startDate: booking.start_date
      ? (typeof booking.start_date === 'string'
          ? booking.start_date.split('T')[0]
          : booking.start_date.toISOString().split('T')[0])
      : '',
    start_date: booking.start_date
      ? (typeof booking.start_date === 'string'
          ? booking.start_date.split('T')[0]
          : booking.start_date.toISOString().split('T')[0])
      : '',
    endDate: booking.end_date
      ? (typeof booking.end_date === 'string'
          ? booking.end_date.split('T')[0]
          : booking.end_date.toISOString().split('T')[0])
      : '',
    end_date: booking.end_date
      ? (typeof booking.end_date === 'string'
          ? booking.end_date.split('T')[0]
          : booking.end_date.toISOString().split('T')[0])
      : '',
    totalDays: booking.total_days,
    total_days: booking.total_days,
    totalAmount: Number(booking.total_amount),
    total_amount: Number(booking.total_amount),
    handoverMethod: booking.handover_method,
    handover_method: booking.handover_method,
    status: booking.status,
    rejectionReason: booking.rejection_reason,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    equipment: booking.equipment ? {
      id: booking.equipment.id,
      name: booking.equipment.name,
      category: booking.equipment.category,
      pricePerDay: Number(booking.equipment.price_per_day),
      image: booking.equipment.image,
      city: booking.equipment.city,
      state: booking.equipment.state
    } : undefined
  }
}

/**
 * Create a new booking request.
 * POST /api/bookings
 * Protected: Requires authentication + FARMER role.
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      equipmentId,
      equipment_id,
      startDate,
      start_date,
      endDate,
      end_date,
      handoverMethod,
      handover_method
    } = req.body

    // 1. Resolve inputs
    const rawEquipmentId = equipmentId !== undefined ? equipmentId : equipment_id
    const rawStartDate = startDate || start_date
    const rawEndDate = endDate || end_date
    const rawHandoverMethod = (handoverMethod || handover_method || 'PICKUP').toUpperCase()

    // 2. Validate equipmentId
    const parsedEquipmentId = parseInt(rawEquipmentId, 10)
    if (isNaN(parsedEquipmentId)) {
      throw new AppError('Valid equipmentId is required', 400)
    }

    // 3. Validate dates
    if (!rawStartDate || !rawEndDate) {
      throw new AppError('startDate and endDate are required', 400)
    }

    const startDateStr = String(rawStartDate).split('T')[0]
    const endDateStr = String(rawEndDate).split('T')[0]

    const start = new Date(startDateStr + 'T00:00:00Z')
    const end = new Date(endDateStr + 'T00:00:00Z')

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format. Expected YYYY-MM-DD', 400)
    }

    if (end < start) {
      throw new AppError('endDate must be greater than or equal to startDate', 400)
    }

    // 4. Validate handover method
    if (!['PICKUP', 'DELIVERY'].includes(rawHandoverMethod)) {
      throw new AppError('Invalid handoverMethod. Must be PICKUP or DELIVERY', 400)
    }

    // 5. Validate equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: parsedEquipmentId }
    })

    if (!equipment) {
      throw new AppError('Equipment not found', 404)
    }

    // 6. Calculate totalDays and totalAmount from equipment.price_per_day
    // Inclusive days: e.g., 2024-10-01 to 2024-10-01 is 1 full day rental
    const diffMs = end.getTime() - start.getTime()
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
    const pricePerDay = Number(equipment.price_per_day)
    const totalAmount = totalDays * pricePerDay

    // 7. Check for overlapping active or confirmed bookings
    // Two intervals [A_start, A_end] and [B_start, B_end] overlap if:
    // A_start <= B_end AND A_end >= B_start
    const overlapping = await prisma.booking.findFirst({
      where: {
        equipment_id: parsedEquipmentId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        },
        start_date: {
          lte: end
        },
        end_date: {
          gte: start
        }
      }
    })

    if (overlapping) {
      throw new AppError('Equipment is already booked for the selected dates', 400)
    }

    // 8. Always set farmer_id from req.user.id (never from request body)
    const farmerId = req.user.id

    // 9. Create booking with status PENDING
    const newBooking = await prisma.booking.create({
      data: {
        equipment_id: parsedEquipmentId,
        farmer_id: farmerId,
        start_date: start,
        end_date: end,
        total_days: totalDays,
        total_amount: totalAmount,
        handover_method: rawHandoverMethod,
        status: 'PENDING'
      },
      include: {
        equipment: true
      }
    })

    res.status(201).json({
      message: 'Booking request submitted successfully',
      booking: formatBooking(newBooking)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get current user's bookings (Helper for user/farmer overview)
 * GET /api/bookings/my
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { farmer_id: req.user.id },
      include: { equipment: true },
      orderBy: { created_at: 'desc' }
    })

    res.json(bookings.map(formatBooking))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  formatBooking
}

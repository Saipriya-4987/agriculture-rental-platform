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
    rejection_reason: booking.rejection_reason,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    equipment: booking.equipment ? {
      id: booking.equipment.id,
      name: booking.equipment.name,
      category: booking.equipment.category,
      pricePerDay: Number(booking.equipment.price_per_day),
      price_per_day: Number(booking.equipment.price_per_day),
      image: booking.equipment.image,
      city: booking.equipment.city,
      state: booking.equipment.state,
      owner: booking.equipment.owner,
      ownerId: booking.equipment.owner_id || null,
      categoryValue: booking.equipment.category_value || ''
    } : undefined,
    farmer: booking.farmer ? {
      id: booking.farmer.id,
      name: booking.farmer.name,
      email: booking.farmer.email,
      phone: booking.farmer.phone
    } : undefined,
    reviews: booking.reviews ? booking.reviews.map(r => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: r.created_at
    })) : [],
    isReviewed: Boolean(booking.reviews && booking.reviews.length > 0),
    agreementAcceptance: booking.agreement_acceptance ? {
      bookingId: booking.agreement_acceptance.booking_id,
      agreementVersion: booking.agreement_acceptance.agreement_version,
      acceptedBy: booking.agreement_acceptance.accepted_by,
      acceptedAt: booking.agreement_acceptance.accepted_at
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
      handover_method,
      agreementAccepted,
      agreement_accepted
    } = req.body

    // 0. Enforce Agreement Acceptance (PRD §7.5 FR-AGR-01/02, TRD §8.2)
    const isAgreementAccepted = Boolean(agreementAccepted === true || agreement_accepted === true)
    if (!isAgreementAccepted) {
      throw new AppError('Rental agreement must be accepted to place a booking request', 400)
    }

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
    const diffMs = end.getTime() - start.getTime()
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
    const pricePerDay = Number(equipment.price_per_day)
    const totalAmount = totalDays * pricePerDay

    // 7. Check for overlapping active or confirmed bookings
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

    // 9. Create booking with status PENDING and record agreement acceptance in a transaction
    const newBooking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
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
          equipment: true,
          farmer: true
        }
      })

      const acceptanceRecord = await tx.agreementAcceptance.create({
        data: {
          booking_id: createdBooking.id,
          agreement_version: 'v1.0',
          accepted_by: farmerId
        }
      })

      return {
        ...createdBooking,
        agreement_acceptance: acceptanceRecord
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
 * Get current user's bookings (Farmer view)
 * GET /api/bookings/my
 * Supports optional ?status=... or ?type=current|past
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { status, type } = req.query
    const where = { farmer_id: req.user.id }

    if (status) {
      const statusList = String(status).split(',').map((s) => s.trim().toUpperCase())
      where.status = statusList.length === 1 ? statusList[0] : { in: statusList }
    } else if (type === 'current') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
    } else if (type === 'past') {
      where.status = { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] }
    }

    let bookings
    try {
      bookings = await prisma.booking.findMany({
        where,
        include: {
          equipment: true,
          farmer: true,
          reviews: true,
          agreement_acceptance: true
        },
        orderBy: { created_at: 'desc' }
      })
    } catch {
      bookings = await prisma.booking.findMany({
        where,
        include: {
          equipment: true,
          farmer: true,
          reviews: true
        },
        orderBy: { created_at: 'desc' }
      })
    }

    res.json(bookings.map(formatBooking))
  } catch (err) {
    next(err)
  }
}

/**
 * Get bookings for equipment owned by current owner
 * GET /api/bookings/owner
 * Supports optional ?status=... or ?type=current|past
 */
const getOwnerBookings = async (req, res, next) => {
  try {
    const ownerId = req.user.id
    const { status, type } = req.query

    // Retrieve equipment belonging to this owner
    const ownerEquipments = await prisma.equipment.findMany({
      where: {
        OR: [
          { owner_id: ownerId },
          { owner: req.user.name },
          { owner: req.user.email }
        ]
      },
      select: { id: true }
    })

    const equipmentIds = ownerEquipments.map((eq) => eq.id)

    const where = {
      equipment_id: { in: equipmentIds }
    }

    if (status) {
      const statusList = String(status).split(',').map((s) => s.trim().toUpperCase())
      where.status = statusList.length === 1 ? statusList[0] : { in: statusList }
    } else if (type === 'current') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
    } else if (type === 'past') {
      where.status = { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] }
    }

    let bookings
    try {
      bookings = await prisma.booking.findMany({
        where,
        include: {
          equipment: true,
          farmer: true,
          agreement_acceptance: true
        },
        orderBy: { created_at: 'desc' }
      })
    } catch {
      bookings = await prisma.booking.findMany({
        where,
        include: {
          equipment: true,
          farmer: true
        },
        orderBy: { created_at: 'desc' }
      })
    }

    res.json(bookings.map(formatBooking))
  } catch (err) {
    next(err)
  }
}

/**
 * Update booking status according to lifecycle rules and ownership.
 * PATCH /api/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      throw new AppError('Invalid booking ID', 400)
    }

    req.body = req.body || {}
    const { status, rejectionReason, rejection_reason } = req.body
    if (!status) {
      throw new AppError('Status is required', 400)
    }

    const targetStatus = String(status).toUpperCase()
    const validStatuses = ['CONFIRMED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED']
    if (!validStatuses.includes(targetStatus)) {
      throw new AppError(`Invalid status '${targetStatus}'`, 400)
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
        farmer: true
      }
    })

    if (!booking) {
      throw new AppError('Booking not found', 404)
    }

    const currentStatus = booking.status
    const isFarmer = req.user.id === booking.farmer_id
    const isEquipmentOwner = Boolean(
      (booking.equipment.owner_id && booking.equipment.owner_id === req.user.id) ||
      (booking.equipment.owner && (booking.equipment.owner === req.user.name || booking.equipment.owner === req.user.email))
    )

    // Enforce ownership and transition rules
    if (targetStatus === 'CONFIRMED') {
      if (!isEquipmentOwner) {
        throw new AppError('Forbidden: Only the equipment owner can confirm bookings', 403)
      }
      if (currentStatus !== 'PENDING') {
        throw new AppError(`Cannot confirm booking from status '${currentStatus}'. Only PENDING bookings can be confirmed.`, 400)
      }
    } else if (targetStatus === 'REJECTED') {
      if (!isEquipmentOwner) {
        throw new AppError('Forbidden: Only the equipment owner can reject bookings', 403)
      }
      if (currentStatus !== 'PENDING') {
        throw new AppError(`Cannot reject booking from status '${currentStatus}'. Only PENDING bookings can be rejected.`, 400)
      }
    } else if (targetStatus === 'CANCELLED') {
      if (!isFarmer) {
        throw new AppError('Forbidden: Farmers can cancel only their own bookings', 403)
      }
      if (currentStatus !== 'PENDING') {
        throw new AppError(`Cannot cancel booking from status '${currentStatus}'. Only PENDING bookings can be cancelled.`, 400)
      }
    } else if (targetStatus === 'ACTIVE') {
      if (!isEquipmentOwner && !isFarmer) {
        throw new AppError('Forbidden: Not authorized to activate this booking', 403)
      }
      if (currentStatus !== 'CONFIRMED') {
        throw new AppError(`Cannot activate booking from status '${currentStatus}'. Only CONFIRMED bookings can become ACTIVE.`, 400)
      }
    } else if (targetStatus === 'COMPLETED') {
      if (!isEquipmentOwner && !isFarmer) {
        throw new AppError('Forbidden: Not authorized to complete this booking', 403)
      }
      if (currentStatus !== 'ACTIVE') {
        throw new AppError(`Cannot complete booking from status '${currentStatus}'. Only ACTIVE bookings can become COMPLETED.`, 400)
      }
    }

    const dataToUpdate = {
      status: targetStatus,
      updated_at: new Date()
    }

    const finalReason = rejectionReason || rejection_reason
    if (targetStatus === 'REJECTED') {
      dataToUpdate.rejection_reason = finalReason || 'Booking request rejected by owner.'
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: dataToUpdate,
      include: {
        equipment: true,
        farmer: true
      }
    })

    res.json({
      message: `Booking status updated to ${targetStatus}`,
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

const confirmBooking = (req, res, next) => {
  req.body = req.body || {}
  req.body.status = 'CONFIRMED'
  return updateBookingStatus(req, res, next)
}

const rejectBooking = (req, res, next) => {
  req.body = req.body || {}
  req.body.status = 'REJECTED'
  return updateBookingStatus(req, res, next)
}

const cancelBooking = (req, res, next) => {
  req.body = req.body || {}
  req.body.status = 'CANCELLED'
  return updateBookingStatus(req, res, next)
}

const activateBooking = (req, res, next) => {
  req.body = req.body || {}
  req.body.status = 'ACTIVE'
  return updateBookingStatus(req, res, next)
}

const completeBooking = (req, res, next) => {
  req.body = req.body || {}
  req.body.status = 'COMPLETED'
  return updateBookingStatus(req, res, next)
}

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  activateBooking,
  completeBooking,
  formatBooking
}

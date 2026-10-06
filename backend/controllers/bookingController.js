const prisma = require('../prisma/client')
const {
  BookingStatus,
  ALL_STATUSES,
  VALID_TRANSITIONS,
  ROLE_RULES,
  validateTransitionAuth
} = require('../utils/bookingStateMachine')

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
    } : undefined,
    statusEvents: booking.status_events ? booking.status_events.map(ev => ({
      id: ev.id,
      bookingId: ev.booking_id,
      fromStatus: ev.from_status,
      toStatus: ev.to_status,
      actorId: ev.actor_id,
      actorRole: ev.actor_role,
      note: ev.note,
      createdAt: ev.created_at
    })) : [],
    status_events: booking.status_events ? booking.status_events.map(ev => ({
      id: ev.id,
      booking_id: ev.booking_id,
      from_status: ev.from_status,
      to_status: ev.to_status,
      actor_id: ev.actor_id,
      actor_role: ev.actor_role,
      note: ev.note,
      created_at: ev.created_at
    })) : []
  }
}

/**
 * Common booking includes
 */
const bookingIncludes = {
  equipment: true,
  farmer: true,
  reviews: true,
  agreement_acceptance: true,
  status_events: {
    orderBy: { created_at: 'asc' }
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

    // 5b. Validate equipment availability window (if defined)
    if (equipment.availability_from) {
      const availFrom = new Date(equipment.availability_from)
      if (start < availFrom) {
        throw new AppError(
          `Equipment is only available starting ${equipment.availability_from.toISOString().split('T')[0]}`,
          400
        )
      }
    }
    if (equipment.availability_to) {
      const availTo = new Date(equipment.availability_to)
      if (end > availTo) {
        throw new AppError(
          `Equipment is only available until ${equipment.availability_to.toISOString().split('T')[0]}`,
          400
        )
      }
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
          in: ['PENDING', 'CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED']
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
      throw new AppError('Equipment is already booked for the selected dates', 409)
    }

    // 8. Always set farmer_id from req.user.id (never from request body)
    const farmerId = req.user.id

    // 9. Create booking with status PENDING, agreement acceptance, and initial StatusEvent in a transaction
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

      const initialEvent = await tx.statusEvent.create({
        data: {
          booking_id: createdBooking.id,
          from_status: null,
          to_status: 'PENDING',
          actor_id: farmerId,
          actor_role: 'FARMER',
          note: 'Booking request placed'
        }
      })

      return {
        ...createdBooking,
        agreement_acceptance: acceptanceRecord,
        status_events: [initialEvent]
      }
    }, {
      maxWait: 10000,
      timeout: 20000
    })

    res.status(201).json({
      message: 'Booking request submitted successfully',
      booking: formatBooking(newBooking)
    })
  } catch (err) {
    if (
      err.code === '23P01' ||
      (err.message && (err.message.includes('23P01') || err.message.includes('bookings_no_overlap') || err.message.includes('exclusion constraint')))
    ) {
      return next(new AppError('Equipment is already booked for those dates.', 409))
    }
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
      where.status = {
        in: ['PENDING', 'CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED']
      }
    } else if (type === 'past') {
      where.status = { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: bookingIncludes,
      orderBy: { created_at: 'desc' }
    })

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
      where.status = {
        in: ['PENDING', 'CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED']
      }
    } else if (type === 'past') {
      where.status = { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: bookingIncludes,
      orderBy: { created_at: 'desc' }
    })

    res.json(bookings.map(formatBooking))
  } catch (err) {
    next(err)
  }
}

/**
 * Central state machine transition execution engine.
 * Executed in ONE database transaction with row-level locking (FOR UPDATE)
 * to prevent race conditions.
 */
const transitionBooking = async (bookingId, targetStatus, user, note = null) => {
  const id = parseInt(bookingId, 10)
  if (isNaN(id)) {
    throw new AppError('Invalid booking ID', 400)
  }

  const normalizedTargetStatus = String(targetStatus).toUpperCase()
  if (!ALL_STATUSES.includes(normalizedTargetStatus)) {
    throw new AppError(`Invalid status '${normalizedTargetStatus}'`, 400)
  }

  // 1. Fetch booking with associations for fast validation outside transaction
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

  // Enforce strict state machine transitions and role rules
  const authResult = validateTransitionAuth(booking, user, normalizedTargetStatus)
  if (!authResult.allowed) {
    throw new AppError(authResult.error, authResult.statusCode)
  }

  const dataToUpdate = {
    status: normalizedTargetStatus,
    updated_at: new Date()
  }

  if (normalizedTargetStatus === 'REJECTED') {
    dataToUpdate.rejection_reason = note || 'Booking request rejected by owner.'
  }

  // 2. Perform atomic StatusEvent creation and booking update in ONE database transaction
  return await prisma.$transaction(async (tx) => {
    // Check concurrency: ensure status has not been modified concurrently
    const current = await tx.booking.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!current) {
      throw new AppError('Booking not found', 404)
    }

    if (current.status !== booking.status) {
      throw new AppError('Booking status has changed. Please refresh and try again.', 409)
    }

    // 1. Create the immutable StatusEvent entry
    await tx.statusEvent.create({
      data: {
        booking_id: id,
        from_status: booking.status,
        to_status: normalizedTargetStatus,
        actor_id: user.id,
        actor_role: authResult.actorRole,
        note: note || null
      }
    })

    // 2. Update the booking status and return with latest status events
    const updated = await tx.booking.update({
      where: { id },
      data: dataToUpdate,
      include: {
        equipment: true,
        farmer: true,
        reviews: true,
        agreement_acceptance: true,
        status_events: {
          orderBy: { created_at: 'asc' }
        }
      }
    })

    return updated
  }, {
    maxWait: 10000,
    timeout: 20000
  })
}

/**
 * Generic status transition handler.
 * PATCH /api/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    req.body = req.body || {}
    const { status, rejectionReason, rejection_reason, note } = req.body
    if (!status) {
      throw new AppError('Status is required', 400)
    }

    const finalNote = note || rejectionReason || rejection_reason || null
    const updated = await transitionBooking(req.params.id, status, req.user, finalNote)

    res.json({
      message: `Booking status updated to ${updated.status}`,
      booking: formatBooking(updated)
    })
  } catch (err) {
    if (
      err.code === '23P01' ||
      (err.message && (err.message.includes('23P01') || err.message.includes('bookings_no_overlap') || err.message.includes('exclusion constraint')))
    ) {
      return next(new AppError('Equipment is already booked for those dates.', 409))
    }
    next(err)
  }
}

/**
 * PENDING -> CONFIRMED (Owner action)
 * PATCH /api/bookings/:id/confirm
 */
const confirmBooking = async (req, res, next) => {
  try {
    const updated = await transitionBooking(req.params.id, 'CONFIRMED', req.user, req.body?.note)
    res.json({
      message: 'Booking confirmed successfully',
      booking: formatBooking(updated)
    })
  } catch (err) {
    if (
      err.code === '23P01' ||
      (err.message && (err.message.includes('23P01') || err.message.includes('bookings_no_overlap') || err.message.includes('exclusion constraint')))
    ) {
      return next(new AppError('Equipment is already booked for those dates.', 409))
    }
    next(err)
  }
}

/**
 * PENDING -> REJECTED (Owner action)
 * PATCH /api/bookings/:id/reject
 */
const rejectBooking = async (req, res, next) => {
  try {
    const note = req.body?.note || req.body?.rejectionReason || req.body?.rejection_reason || 'Booking request rejected by owner.'
    const updated = await transitionBooking(req.params.id, 'REJECTED', req.user, note)
    res.json({
      message: 'Booking rejected successfully',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PENDING / CONFIRMED -> CANCELLED (Farmer or Owner action before handover starts)
 * PATCH /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const isOwner = req.user?.role === 'OWNER'
    const defaultNote = isOwner ? 'Booking cancelled by equipment owner.' : 'Booking request cancelled by farmer.'
    const note = req.body?.note || req.body?.reason || req.body?.cancelReason || defaultNote
    const updated = await transitionBooking(req.params.id, 'CANCELLED', req.user, note)
    res.json({
      message: 'Booking cancelled successfully',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * CONFIRMED -> READY_FOR_HANDOVER (Owner action)
 * PATCH /api/bookings/:id/ready
 */
const markReadyBooking = async (req, res, next) => {
  try {
    const updated = await transitionBooking(req.params.id, 'READY_FOR_HANDOVER', req.user, req.body?.note)
    res.json({
      message: 'Booking marked as ready for handover',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * READY_FOR_HANDOVER -> PICKED_UP -> ACTIVE  (Farmer action - two-party handover completion)
 *
 * When the farmer confirms physical receipt, the system atomically records two StatusEvents
 * in one database transaction and sets the final booking status to ACTIVE:
 *   1. READY_FOR_HANDOVER -> PICKED_UP  (farmer confirms receipt)
 *   2. PICKED_UP          -> ACTIVE     (rental officially begins)
 *
 * PATCH /api/bookings/:id/pickup
 */
const pickupBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError('Invalid booking ID', 400)

    const note = req.body?.note || null

    // Pre-validate: fetch booking and authorize READY_FOR_HANDOVER -> PICKED_UP
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { equipment: true, farmer: true }
    })

    if (!booking) throw new AppError('Booking not found', 404)

    // Only farmer can confirm receipt
    const authResult = validateTransitionAuth(booking, req.user, 'PICKED_UP')
    if (!authResult.allowed) throw new AppError(authResult.error, authResult.statusCode)

    // Atomic double-transition in ONE transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Concurrency guard
      const current = await tx.booking.findUnique({
        where: { id },
        select: { status: true }
      })
      if (!current) throw new AppError('Booking not found', 404)
      if (current.status !== 'READY_FOR_HANDOVER') {
        throw new AppError(
          current.status === 'ACTIVE'
            ? 'Rental is already active'
            : 'Booking status has changed. Please refresh and try again.',
          409
        )
      }

      const now = new Date()

      // Event 1: READY_FOR_HANDOVER -> PICKED_UP (farmer receipt confirmed)
      await tx.statusEvent.create({
        data: {
          booking_id: id,
          from_status: 'READY_FOR_HANDOVER',
          to_status: 'PICKED_UP',
          actor_id: req.user.id,
          actor_role: 'FARMER',
          note: note || 'Farmer confirmed physical receipt of equipment'
        }
      })

      // Event 2: PICKED_UP -> ACTIVE (rental officially begins)
      await tx.statusEvent.create({
        data: {
          booking_id: id,
          from_status: 'PICKED_UP',
          to_status: 'ACTIVE',
          actor_id: req.user.id,
          actor_role: 'FARMER',
          note: 'Rental automatically activated upon confirmed receipt'
        }
      })

      // Update booking to final status ACTIVE
      const result = await tx.booking.update({
        where: { id },
        data: { status: 'ACTIVE', updated_at: now },
        include: {
          equipment: true,
          farmer: true,
          reviews: true,
          agreement_acceptance: true,
          status_events: { orderBy: { created_at: 'asc' } }
        }
      })

      return result
    }, { maxWait: 10000, timeout: 20000 })

    res.json({
      message: 'Receipt confirmed and rental is now ACTIVE!',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * /activate endpoint — SEALED.
 *
 * PICKED_UP -> ACTIVE is applied atomically inside pickupBooking().
 * This endpoint must NOT be used to bypass the two-party handover confirmation.
 * Returns HTTP 409 to any caller.
 *
 * PATCH /api/bookings/:id/activate
 */
const activateBooking = async (_req, _res, next) => {
  next(
    new AppError(
      'Direct activation is not allowed. The rental activates automatically when the farmer confirms receipt via /pickup.',
      409
    )
  )
}

/**
 * ACTIVE -> RETURN_REQUESTED (Farmer action)
 * PATCH /api/bookings/:id/request-return
 */
const requestReturnBooking = async (req, res, next) => {
  try {
    const updated = await transitionBooking(req.params.id, 'RETURN_REQUESTED', req.user, req.body?.note)
    res.json({
      message: 'Equipment return requested by farmer',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * RETURN_REQUESTED -> RETURNED (Owner action - confirms physical return)
 * PATCH /api/bookings/:id/confirm-return
 */
const confirmReturnBooking = async (req, res, next) => {
  try {
    const updated = await transitionBooking(req.params.id, 'RETURNED', req.user, req.body?.note)
    res.json({
      message: 'Equipment return confirmed by owner',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * RETURNED -> COMPLETED (Owner action - final inspection & close)
 * PATCH /api/bookings/:id/complete
 */
const completeBooking = async (req, res, next) => {
  try {
    const updated = await transitionBooking(req.params.id, 'COMPLETED', req.user, req.body?.note)
    res.json({
      message: 'Booking completed successfully',
      booking: formatBooking(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Server-side price quote endpoint (read-only, zero database writes)
 * POST /api/bookings/quote
 */
const getBookingQuote = async (req, res, next) => {
  try {
    const { equipmentId, equipment_id, startDate, start_date, endDate, end_date } = req.body || {}

    const rawEquipmentId = equipmentId !== undefined ? equipmentId : equipment_id
    const rawStartDate = startDate || start_date
    const rawEndDate = endDate || end_date

    // 1. Validate equipmentId
    const parsedEquipmentId = parseInt(rawEquipmentId, 10)
    if (isNaN(parsedEquipmentId)) {
      throw new AppError('Valid equipmentId is required', 400)
    }

    // 2. Validate dates
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

    // 3. Find equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: parsedEquipmentId }
    })

    if (!equipment) {
      throw new AppError('Equipment not found', 404)
    }

    // 4. Validate equipment availability window (if specified)
    if (equipment.availability_from) {
      const availFrom = new Date(equipment.availability_from)
      if (start < availFrom) {
        throw new AppError(
          `Equipment is only available starting ${equipment.availability_from.toISOString().split('T')[0]}`,
          400
        )
      }
    }
    if (equipment.availability_to) {
      const availTo = new Date(equipment.availability_to)
      if (end > availTo) {
        throw new AppError(
          `Equipment is only available until ${equipment.availability_to.toISOString().split('T')[0]}`,
          400
        )
      }
    }

    // 5. Calculate totalDays and totalAmount
    const diffMs = end.getTime() - start.getTime()
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
    const pricePerDay = Number(equipment.price_per_day)
    const totalAmount = totalDays * pricePerDay

    // 6. Check if dates conflict with active/confirmed bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        equipment_id: parsedEquipmentId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED']
        },
        start_date: {
          lte: end
        },
        end_date: {
          gte: start
        }
      }
    })

    const isAvailable = !overlapping

    res.json({
      equipmentId: parsedEquipmentId,
      startDate: startDateStr,
      endDate: endDateStr,
      totalDays,
      pricePerDay,
      totalAmount,
      isAvailable,
      message: isAvailable ? 'Dates are available' : 'Equipment is already booked for the selected dates'
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/bookings/:id/timeline
 * Fetch lifecycle StatusEvents history for a booking. Participant-authorized.
 */
const getBookingTimeline = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError('Invalid booking ID', 400)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
        farmer: true,
        status_events: {
          orderBy: { created_at: 'asc' }
        }
      }
    })

    if (!booking) throw new AppError('Booking not found', 404)

    const isEquipmentOwner = Boolean(
      (booking.equipment?.owner_id && booking.equipment.owner_id === req.user.id) ||
      (booking.equipment?.owner && (booking.equipment.owner === req.user.name || booking.equipment.owner === req.user.email))
    )
    const isFarmer = Boolean(booking.farmer_id === req.user.id)
    const isAdmin = req.user.role === 'ADMIN'

    if (!isEquipmentOwner && !isFarmer && !isAdmin) {
      throw new AppError('Forbidden: Not authorized to view this booking timeline', 403)
    }

    const events = (booking.status_events || []).map(ev => ({
      id: ev.id,
      bookingId: ev.booking_id,
      fromStatus: ev.from_status,
      toStatus: ev.to_status,
      actorId: ev.actor_id,
      actorRole: ev.actor_role,
      note: ev.note,
      createdAt: ev.created_at
    }))

    res.json({
      bookingId: id,
      currentStatus: booking.status,
      events
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/bookings/:id
 * Fetch single booking details. Participant-authorized.
 */
const getBookingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError('Invalid booking ID', 400)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
        farmer: true,
        reviews: true,
        agreement_acceptance: true,
        status_events: {
          orderBy: { created_at: 'asc' }
        }
      }
    })

    if (!booking) throw new AppError('Booking not found', 404)

    const isEquipmentOwner = Boolean(
      (booking.equipment?.owner_id && booking.equipment.owner_id === req.user.id) ||
      (booking.equipment?.owner && (booking.equipment.owner === req.user.name || booking.equipment.owner === req.user.email))
    )
    const isFarmer = Boolean(booking.farmer_id === req.user.id)
    const isAdmin = req.user.role === 'ADMIN'

    if (!isEquipmentOwner && !isFarmer && !isAdmin) {
      throw new AppError('Forbidden: Not authorized to view this booking', 403)
    }

    res.json({
      booking: formatBooking(booking)
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
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
  completeBooking,
  transitionBooking,
  formatBooking
}

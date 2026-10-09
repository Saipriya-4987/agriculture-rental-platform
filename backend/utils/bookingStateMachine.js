/**
 * Booking Lifecycle State Machine
 * Core requirement TRD §7.1 & PRD §7.1
 *
 * Two-party handover flow:
 *  OWNER:  CONFIRMED -> READY_FOR_HANDOVER
 *  FARMER: READY_FOR_HANDOVER -> PICKED_UP (automatically also -> ACTIVE, atomically)
 *
 * PICKED_UP is an internal audit state only. External callers cannot directly
 * trigger PICKED_UP -> ACTIVE; this happens atomically inside pickupBooking().
 */

const { isEquipmentOwner } = require('./ownership')

const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  READY_FOR_HANDOVER: 'READY_FOR_HANDOVER',
  PICKED_UP: 'PICKED_UP',
  ACTIVE: 'ACTIVE',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
}

const ALL_STATUSES = Object.values(BookingStatus)

/**
 * Strict external transition table.
 * PICKED_UP -> ACTIVE is intentionally ABSENT here:
 * it is auto-applied inside pickupBooking() as part of the two-party handover
 * and must never be triggered directly from an external endpoint.
 * Skipping states is NOT allowed.
 */
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['READY_FOR_HANDOVER', 'CANCELLED'],
  READY_FOR_HANDOVER: ['PICKED_UP'],
  PICKED_UP: [],                        // terminal from external view; auto-advances to ACTIVE
  ACTIVE: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: []
}

/**
 * Role permissions per state transition.
 * 'OWNER'  – only equipment owner can execute.
 * 'FARMER' – only renting farmer can execute.
 * 'EITHER' – either participant can execute (e.g. cancellation before handover).
 */
const ROLE_RULES = {
  PENDING: {
    CONFIRMED: 'OWNER',
    REJECTED: 'OWNER',
    CANCELLED: 'EITHER'
  },
  CONFIRMED: {
    READY_FOR_HANDOVER: 'OWNER',
    CANCELLED: 'EITHER'
  },
  READY_FOR_HANDOVER: {
    PICKED_UP: 'FARMER'                 // farmer confirms physical receipt (auto-advances to ACTIVE)
  },
  // No PICKED_UP entry – ACTIVE is applied automatically, not through ROLE_RULES
  ACTIVE: {
    RETURN_REQUESTED: 'FARMER'
  },
  RETURN_REQUESTED: {
    RETURNED: 'OWNER'
  },
  RETURNED: {
    COMPLETED: 'OWNER'
  }
}

/**
 * Check if a state transition is valid in the state machine.
 */
function isValidTransition(fromStatus, toStatus) {
  if (!VALID_TRANSITIONS[fromStatus]) return false
  return VALID_TRANSITIONS[fromStatus].includes(toStatus)
}

/**
 * Determine if user is authorized to perform the transition on this booking.
 */
function validateTransitionAuth(booking, user, targetStatus) {
  const currentStatus = booking.status
  const isOwner = isEquipmentOwner(booking.equipment, user.id)
  const isFarmer = Boolean(booking.farmer_id === user.id)

  if (!isOwner && !isFarmer) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Forbidden: Not authorized to access or modify this booking'
    }
  }

  if (!isValidTransition(currentStatus, targetStatus)) {
    return {
      allowed: false,
      statusCode: 409,
      error: `Invalid state transition from '${currentStatus}' to '${targetStatus}'.`
    }
  }

  const requiredRole = ROLE_RULES[currentStatus]?.[targetStatus]
  if (requiredRole === 'OWNER' && !isOwner) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Forbidden: Only the equipment owner can perform this action'
    }
  }

  if (requiredRole === 'FARMER' && !isFarmer) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Forbidden: Only the renting farmer can perform this action'
    }
  }

  const actorRole = isOwner ? 'OWNER' : 'FARMER'

  return {
    allowed: true,
    actorRole,
    isEquipmentOwner: isOwner,
    isFarmer
  }
}

module.exports = {
  BookingStatus,
  ALL_STATUSES,
  VALID_TRANSITIONS,
  ROLE_RULES,
  isValidTransition,
  validateTransitionAuth
}
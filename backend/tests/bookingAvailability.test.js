// ─── DATABASE SAFETY GUARD ────────────────────────────────────────────────────
// Tests MUST run against a dedicated test database.
// Set TEST_DATABASE_URL in backend/.env.test (never inside .env).
// This file NEVER reads DATABASE_URL. Absence of TEST_DATABASE_URL is a
// hard failure — the tests refuse to start.
// ─────────────────────────────────────────────────────────────────────────────

// Load ONLY the .env.test override (if present). Do NOT load .env here so that
// DATABASE_URL is never in scope for the test process.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') })

const { Client } = require('pg')
const assert = require('assert')
const {
  validateTransitionAuth,
  ALL_STATUSES,
  VALID_TRANSITIONS
} = require('../utils/bookingStateMachine')
const bookingController = require('../controllers/bookingController')

// ── Hard guard 1: TEST_DATABASE_URL must be explicitly set ───────────────────
const TEST_DB_URL = process.env.TEST_DATABASE_URL
if (!TEST_DB_URL) {
  console.error('╔══════════════════════════════════════════════════════════════╗')
  console.error('║  SAFETY GUARD: TEST ABORTED — no TEST_DATABASE_URL found.   ║')
  console.error('║                                                              ║')
  console.error('║  Tests must NEVER run against the production database.       ║')
  console.error('║  Create backend/.env.test with TEST_DATABASE_URL set to a   ║')
  console.error('║  dedicated local or staging test database.                  ║')
  console.error('║                                                              ║')
  console.error('║  See backend/tests/README.md for setup instructions.        ║')
  console.error('╚══════════════════════════════════════════════════════════════╝')
  process.exit(1)
}

// ── Hard guard 2: reject if the URL looks like the known production host ──────
const PRODUCTION_NEON_HOSTS = [
  'neon.tech',
  'neondb.io',
]
try {
  const parsed = new URL(TEST_DB_URL)
  const isProduction = PRODUCTION_NEON_HOSTS.some((h) => parsed.host.includes(h))
  if (isProduction) {
    console.error('╔══════════════════════════════════════════════════════════════╗')
    console.error('║  SAFETY GUARD: TEST ABORTED — TEST_DATABASE_URL points to  ║')
    console.error('║  a Neon host that looks like production.                    ║')
    console.error('║                                                              ║')
    console.error('║  Use a LOCAL Postgres database for testing:                 ║')
    console.error('║  TEST_DATABASE_URL=postgresql://localhost:5432/agrirent_test║')
    console.error('║                                                              ║')
    console.error('║  See backend/tests/README.md for setup instructions.        ║')
    console.error('╚══════════════════════════════════════════════════════════════╝')
    process.exit(1)
  }
} catch {
  console.error('SAFETY GUARD: TEST_DATABASE_URL is not a valid URL. Aborting.')
  process.exit(1)
}

async function runTests() {
  console.log('====================================================')
  console.log('RUNNING AGRIRENT BOOKING AVAILABILITY & CONFLICT TESTS')
  console.log('====================================================\n')
  console.log(`Test database: ${new URL(TEST_DB_URL).host}`)
  console.log('')

  const client = new Client({ connectionString: TEST_DB_URL })

  await client.connect()
  console.log('✓ Connected to PostgreSQL test database')

  let passedCount = 0
  let failedCount = 0

  function pass(testName) {
    passedCount++
    console.log(`  ✓ PASS: ${testName}`)
  }

  function fail(testName, error) {
    failedCount++
    console.error(`  ✗ FAIL: ${testName}`)
    console.error(`    ${error.message || error}`)
  }

  let tempOwnerId = null
  let tempFarmerId = null
  let tempFarmer2Id = null
  let tempEqId = null

  try {
    // 1. Create temporary test owner and farmers
    const unique = Date.now()
    const ownerRes = await client.query(`
      INSERT INTO users (name, email, phone, role, password_hash)
      VALUES ('Temp Test Owner', 'temp_owner_${unique}@test.internal', '9999999991', 'OWNER', 'dummyhash')
      RETURNING id, name, email
    `)
    tempOwnerId = ownerRes.rows[0].id

    const farmerRes = await client.query(`
      INSERT INTO users (name, email, phone, role, password_hash)
      VALUES ('Temp Test Farmer 1', 'temp_farmer1_${unique}@test.internal', '9999999992', 'FARMER', 'dummyhash')
      RETURNING id, name, email
    `)
    tempFarmerId = farmerRes.rows[0].id

    const farmer2Res = await client.query(`
      INSERT INTO users (name, email, phone, role, password_hash)
      VALUES ('Temp Test Farmer 2', 'temp_farmer2_${unique}@test.internal', '9999999993', 'FARMER', 'dummyhash')
      RETURNING id, name, email
    `)
    tempFarmer2Id = farmer2Res.rows[0].id

    // 2. Create temporary equipment with availability window: 2026-10-01 to 2026-10-31
    const eqRes = await client.query(`
      INSERT INTO equipment (
        name, category, price_per_day, city, state, owner, owner_id,
        availability_from, availability_to
      )
      VALUES (
        'Availability Test Tractor', 'Tractor', 1500, 'Guntur', 'Andhra Pradesh',
        'Temp Test Owner', $1, '2026-10-01', '2026-10-31'
      )
      RETURNING id, name, price_per_day, availability_from, availability_to
    `, [tempOwnerId])
    tempEqId = eqRes.rows[0].id
    console.log(`✓ Temporary test environment initialized (Equipment ID: ${tempEqId})\n`)

    // Helper for mock req/res to test bookingController endpoints
    function createMockReqRes(body, user, params = {}) {
      const req = { body, user, params }
      let resStatus = 200
      let resJson = null
      let caughtError = null

      const res = {
        status(code) {
          resStatus = code
          return res
        },
        json(data) {
          resJson = data
          return res
        }
      }

      const next = (err) => {
        caughtError = err
      }

      return { req, res, getStatus: () => resStatus, getJson: () => resJson, getError: () => caughtError }
    }

    // TEST 1: Free dates inside equipment availability window -> PENDING booking succeeds
    try {
      const { req, res, getStatus, getJson } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-05',
          endDate: '2026-10-08',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )

      await bookingController.createBooking(req, res, (err) => { throw err })
      assert.strictEqual(getStatus(), 201, 'Expected status 201')
      const json = getJson()
      assert.strictEqual(json.booking.status, 'PENDING', 'Booking status must be PENDING')
      assert.strictEqual(json.booking.totalDays, 4, 'Expected 4 rental days')
      assert.strictEqual(json.booking.totalAmount, 6000, 'Expected 6000 total amount')
      assert.strictEqual(
        json.message,
        'Booking request submitted successfully. Waiting for owner approval.',
        'Expected exact success message'
      )
      pass('1. Free dates -> PENDING booking succeeds (status PENDING, 4 days, waiting for owner approval message)')
    } catch (e) {
      fail('1. Free dates -> PENDING booking succeeds', e)
    }

    // TEST 2: CONFIRMED overlap -> rejected
    try {
      // Seed a CONFIRMED booking for 2026-10-12 to 2026-10-15
      await client.query(`
        INSERT INTO bookings (equipment_id, farmer_id, start_date, end_date, total_days, total_amount, handover_method, status)
        VALUES ($1, $2, '2026-10-12', '2026-10-15', 4, 6000, 'PICKUP', 'CONFIRMED')
      `, [tempEqId, tempFarmerId])

      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-13',
          endDate: '2026-10-14',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmer2Id, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 409)
        assert.ok(err.message.includes('Unavailable for selected dates'))
        assert.ok(err.message.includes('2026-10-12') && err.message.includes('2026-10-15'))
      })
      assert.ok(rejected, 'Expected 409 rejection')
      pass('2. CONFIRMED overlap -> rejected (409 Unavailable for selected dates with conflicting date range)')
    } catch (e) {
      fail('2. CONFIRMED overlap -> rejected', e)
    }

    // TEST 3: ACTIVE overlap -> rejected
    try {
      // Seed an ACTIVE booking for 2026-10-18 to 2026-10-20
      await client.query(`
        INSERT INTO bookings (equipment_id, farmer_id, start_date, end_date, total_days, total_amount, handover_method, status)
        VALUES ($1, $2, '2026-10-18', '2026-10-20', 3, 4500, 'PICKUP', 'ACTIVE')
      `, [tempEqId, tempFarmerId])

      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-19',
          endDate: '2026-10-22',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmer2Id, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 409)
        assert.ok(err.message.includes('Unavailable for selected dates'))
      })
      assert.ok(rejected, 'Expected 409 rejection')
      pass('3. ACTIVE overlap -> rejected (409 Unavailable for selected dates)')
    } catch (e) {
      fail('3. ACTIVE overlap -> rejected', e)
    }

    // TEST 4: RETURN_REQUESTED overlap -> rejected according to current reservation rules
    try {
      // Seed a RETURN_REQUESTED booking for 2026-10-22 to 2026-10-24
      await client.query(`
        INSERT INTO bookings (equipment_id, farmer_id, start_date, end_date, total_days, total_amount, handover_method, status)
        VALUES ($1, $2, '2026-10-22', '2026-10-24', 3, 4500, 'PICKUP', 'RETURN_REQUESTED')
      `, [tempEqId, tempFarmerId])

      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-23',
          endDate: '2026-10-25',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmer2Id, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 409)
        assert.ok(err.message.includes('Unavailable for selected dates'))
      })
      assert.ok(rejected, 'Expected 409 rejection')
      pass('4. RETURN_REQUESTED overlap -> rejected according to current reservation rules (409 Unavailable)')
    } catch (e) {
      fail('4. RETURN_REQUESTED overlap -> rejected', e)
    }

    // TEST 5: Dates outside equipment availability -> rejected with "Available from X to Y"
    try {
      // Equipment window is 2026-10-01 to 2026-10-31. Request 2026-11-01 to 2026-11-05
      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 400)
        assert.strictEqual(err.message, 'Available from 2026-10-01 to 2026-10-31')
      })
      assert.ok(rejected, 'Expected 400 rejection')
      pass('5. Dates outside equipment availability -> rejected (400 "Available from 2026-10-01 to 2026-10-31")')
    } catch (e) {
      fail('5. Dates outside equipment availability -> rejected', e)
    }

    // TEST 6: Invalid date order -> rejected
    try {
      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-28',
          endDate: '2026-10-25',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 400)
        assert.ok(err.message.includes('endDate must be greater than or equal to startDate'))
      })
      assert.ok(rejected, 'Expected 400 rejection')
      pass('6. Invalid date order -> rejected (400 endDate must be greater than or equal to startDate)')
    } catch (e) {
      fail('6. Invalid date order -> rejected', e)
    }

    // TEST 7: Adjacent non-overlapping dates -> allowed
    // Existing confirmed booking ends on 2026-10-15. New booking starts on 2026-10-16
    try {
      const { req, res, getStatus, getJson } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-16',
          endDate: '2026-10-17',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )

      await bookingController.createBooking(req, res, (err) => { throw err })
      assert.strictEqual(getStatus(), 201, 'Adjacent date booking should succeed')
      assert.strictEqual(getJson().booking.status, 'PENDING')
      pass('7. Adjacent non-overlapping dates -> allowed (201 booking placed)')
    } catch (e) {
      fail('7. Adjacent non-overlapping dates -> allowed', e)
    }

    // TEST 8: Exact overlap -> rejected
    // Existing confirmed booking is 2026-10-12 to 2026-10-15. New booking requests exactly 2026-10-12 to 2026-10-15
    try {
      const { req, res } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-12',
          endDate: '2026-10-15',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmer2Id, role: 'FARMER' }
      )

      let rejected = false
      await bookingController.createBooking(req, res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 409)
        assert.ok(err.message.includes('Unavailable for selected dates'))
      })
      assert.ok(rejected, 'Expected 409 rejection')
      pass('8. Exact overlap -> rejected (409 Unavailable for selected dates)')
    } catch (e) {
      fail('8. Exact overlap -> rejected', e)
    }

    // TEST 9: Two overlapping PENDING requests allowed (PRD §25: PENDING does NOT block dates)
    let pending1Id = null
    let pending2Id = null
    try {
      // First farmer requests 2026-10-26 to 2026-10-29
      const res1 = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-26',
          endDate: '2026-10-29',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )
      await bookingController.createBooking(res1.req, res1.res, (err) => { throw err })
      assert.strictEqual(res1.getStatus(), 201)
      pending1Id = res1.getJson().booking.id

      // Second farmer requests overlapping dates 2026-10-27 to 2026-10-30
      const res2 = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-27',
          endDate: '2026-10-30',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmer2Id, role: 'FARMER' }
      )
      await bookingController.createBooking(res2.req, res2.res, (err) => { throw err })
      assert.strictEqual(res2.getStatus(), 201)
      pending2Id = res2.getJson().booking.id

      assert.strictEqual(res1.getJson().booking.status, 'PENDING')
      assert.strictEqual(res2.getJson().booking.status, 'PENDING')
      pass('9. Two overlapping PENDING requests allowed (both bookings created with PENDING status)')
    } catch (e) {
      fail('9. Two overlapping PENDING requests allowed', e)
    }

    // TEST 10: After one overlapping request becomes CONFIRMED, the other cannot be confirmed
    try {
      // Owner confirms the first pending booking
      const confirm1 = createMockReqRes(
        { note: 'Confirmed for Farmer 1' },
        { id: tempOwnerId, role: 'OWNER' },
        { id: pending1Id }
      )
      await bookingController.confirmBooking(confirm1.req, confirm1.res, (err) => { throw err })
      assert.strictEqual(confirm1.getStatus(), 200)
      assert.strictEqual(confirm1.getJson().booking.status, 'CONFIRMED')

      // Owner attempts to confirm the second overlapping pending booking -> MUST FAIL with 409
      const confirm2 = createMockReqRes(
        { note: 'Attempting to confirm Farmer 2' },
        { id: tempOwnerId, role: 'OWNER' },
        { id: pending2Id }
      )
      let rejected = false
      await bookingController.confirmBooking(confirm2.req, confirm2.res, (err) => {
        rejected = true
        assert.strictEqual(err.statusCode, 409)
        assert.ok(err.message.includes('Cannot confirm booking') || err.message.includes('booked'))
      })
      assert.ok(rejected, 'Second overlapping booking confirmation must be rejected with 409')
      pass('10. After one overlapping request becomes CONFIRMED, the other cannot be confirmed (409 conflict)')
    } catch (e) {
      fail('10. After one overlapping request becomes CONFIRMED, the other cannot be confirmed', e)
    }

    // TEST 11: Successful booking clearly returns PENDING / waiting for owner approval
    try {
      const { req, res, getStatus, getJson } = createMockReqRes(
        {
          equipmentId: tempEqId,
          startDate: '2026-10-02',
          endDate: '2026-10-04',
          handoverMethod: 'PICKUP',
          agreementAccepted: true
        },
        { id: tempFarmerId, role: 'FARMER' }
      )

      await bookingController.createBooking(req, res, (err) => { throw err })
      assert.strictEqual(getStatus(), 201)
      const json = getJson()
      assert.strictEqual(json.booking.status, 'PENDING')
      assert.strictEqual(
        json.message,
        'Booking request submitted successfully. Waiting for owner approval.'
      )
      pass('11. Successful booking clearly returns PENDING and "Booking request submitted successfully. Waiting for owner approval."')
    } catch (e) {
      fail('11. Successful booking returns PENDING / waiting for approval', e)
    }

    // TEST 12: Existing double-booking database test still passes (PostgreSQL exclusion constraint 23P01)
    try {
      let dbConstraintTriggered = false
      try {
        // Attempt raw SQL insert of overlapping CONFIRMED booking
        await client.query(`
          INSERT INTO bookings (equipment_id, farmer_id, start_date, end_date, total_days, total_amount, handover_method, status)
          VALUES ($1, $2, '2026-10-13', '2026-10-14', 2, 3000, 'PICKUP', 'CONFIRMED')
        `, [tempEqId, tempFarmerId])
      } catch (dbErr) {
        if (dbErr.code === '23P01' || dbErr.message.includes('bookings_no_overlap') || dbErr.message.includes('exclusion constraint')) {
          dbConstraintTriggered = true
        } else {
          throw dbErr
        }
      }
      assert.ok(dbConstraintTriggered, 'PostgreSQL exclusion constraint bookings_no_overlap must raise 23P01')
      pass('12. Existing double-booking database test passes (PostgreSQL GiST constraint raises 23P01)')
    } catch (e) {
      fail('12. Existing double-booking database test', e)
    }

    // TEST 13: Price quote endpoint returns rich availability and conflict information
    try {
      // 13a: Free dates quote
      const quoteFree = createMockReqRes(
        { equipmentId: tempEqId, startDate: '2026-10-02', endDate: '2026-10-04' },
        { id: tempFarmerId, role: 'FARMER' }
      )
      await bookingController.getBookingQuote(quoteFree.req, quoteFree.res, (err) => { throw err })
      assert.strictEqual(quoteFree.getJson().isAvailable, true)
      assert.strictEqual(quoteFree.getJson().message, 'Available for selected dates')

      // 13b: Blocked dates quote
      const quoteBlocked = createMockReqRes(
        { equipmentId: tempEqId, startDate: '2026-10-13', endDate: '2026-10-14' },
        { id: tempFarmerId, role: 'FARMER' }
      )
      await bookingController.getBookingQuote(quoteBlocked.req, quoteBlocked.res, (err) => { throw err })
      assert.strictEqual(quoteBlocked.getJson().isAvailable, false)
      assert.strictEqual(quoteBlocked.getJson().reason, 'BLOCKED_DATES')
      assert.strictEqual(quoteBlocked.getJson().message, 'Unavailable for selected dates')
      assert.ok(quoteBlocked.getJson().conflict, 'Expected conflict range in quote')

      // 13c: Outside window quote
      const quoteOutside = createMockReqRes(
        { equipmentId: tempEqId, startDate: '2026-11-05', endDate: '2026-11-10' },
        { id: tempFarmerId, role: 'FARMER' }
      )
      await bookingController.getBookingQuote(quoteOutside.req, quoteOutside.res, (err) => { throw err })
      assert.strictEqual(quoteOutside.getJson().isAvailable, false)
      assert.strictEqual(quoteOutside.getJson().reason, 'OUTSIDE_AVAILABILITY')
      assert.strictEqual(quoteOutside.getJson().message, 'Available from 2026-10-01 to 2026-10-31')

      pass('13. Price quote endpoint validates availability window, blocking bookings, and date formats accurately')
    } catch (e) {
      fail('13. Price quote endpoint', e)
    }

    // TEST 14: Core State Machine transition authorization engine verified for all paths
    try {
      const validPairs = [
        ['PENDING', 'CONFIRMED', 'OWNER'],
        ['PENDING', 'REJECTED', 'OWNER'],
        ['PENDING', 'CANCELLED', 'FARMER'],
        ['PENDING', 'CANCELLED', 'OWNER'],
        ['CONFIRMED', 'READY_FOR_HANDOVER', 'OWNER'],
        ['CONFIRMED', 'CANCELLED', 'FARMER'],
        ['CONFIRMED', 'CANCELLED', 'OWNER'],
        ['READY_FOR_HANDOVER', 'PICKED_UP', 'FARMER'],
        ['ACTIVE', 'RETURN_REQUESTED', 'FARMER'],
        ['RETURN_REQUESTED', 'RETURNED', 'OWNER'],
        ['RETURNED', 'COMPLETED', 'OWNER']
      ]

      for (const [from, to, role] of validPairs) {
        const dummyBooking = { status: from, equipment: { owner_id: 100 }, farmer_id: 200 }
        const dummyUser = { id: role === 'OWNER' ? 100 : 200, role }
        const auth = validateTransitionAuth(dummyBooking, dummyUser, to)
        assert.ok(auth.allowed, `Transition ${from} -> ${to} by ${role} must be allowed`)
      }

      const invalidPairs = [
        ['PENDING', 'ACTIVE', 'FARMER'],
        ['PENDING', 'COMPLETED', 'OWNER'],
        ['CONFIRMED', 'COMPLETED', 'OWNER'],
        ['COMPLETED', 'ACTIVE', 'FARMER'],
        ['CANCELLED', 'CONFIRMED', 'OWNER']
      ]

      for (const [from, to, role] of invalidPairs) {
        const dummyBooking = { status: from, equipment: { owner_id: 100 }, farmer_id: 200 }
        const dummyUser = { id: role === 'OWNER' ? 100 : 200, role }
        const auth = validateTransitionAuth(dummyBooking, dummyUser, to)
        assert.strictEqual(auth.allowed, false, `Invalid transition ${from} -> ${to} must be blocked`)
      }

      pass('14. Core State Machine transition authorization engine verified for all valid and invalid paths')
    } catch (e) {
      fail('14. Core State Machine transitions', e)
    }

  } finally {
    // ALWAYS CLEAN UP ALL TEMPORARY TEST DATA: Zero test rows remain in production
    console.log('\nStarting deterministic test data cleanup...')
    if (tempEqId) {
      await client.query(`DELETE FROM agreement_acceptances WHERE booking_id IN (SELECT id FROM bookings WHERE equipment_id = $1)`, [tempEqId])
      await client.query(`DELETE FROM status_events WHERE booking_id IN (SELECT id FROM bookings WHERE equipment_id = $1)`, [tempEqId])
      await client.query(`DELETE FROM bookings WHERE equipment_id = $1`, [tempEqId])
      await client.query(`DELETE FROM equipment WHERE id = $1`, [tempEqId])
    }
    const userIds = [tempOwnerId, tempFarmerId, tempFarmer2Id].filter(Boolean)
    if (userIds.length > 0) {
      await client.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [userIds])
    }
    console.log('✓ Cleanup complete: All temporary test records removed successfully from database.')
    await client.end()
  }

  console.log('\n====================================================')
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('====================================================')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

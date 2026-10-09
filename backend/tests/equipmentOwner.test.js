// ─── DATABASE SAFETY GUARD (same policy as bookingAvailability.test.js) ───────
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') })

const { Client } = require('pg')
const assert = require('assert')
const equipmentController = require('../controllers/equipmentController')

const TEST_DB_URL = process.env.TEST_DATABASE_URL
if (!TEST_DB_URL) {
  console.error('SAFETY GUARD: TEST ABORTED — no TEST_DATABASE_URL found. See backend/tests/README.md')
  process.exit(1)
}

const PRODUCTION_NEON_HOSTS = ['neon.tech', 'neondb.io']
try {
  const parsed = new URL(TEST_DB_URL)
  const isProduction = PRODUCTION_NEON_HOSTS.some((h) => parsed.host.includes(h))
  if (isProduction) {
    console.error('SAFETY GUARD: TEST ABORTED — TEST_DATABASE_URL must not point at Neon production hosts.')
    process.exit(1)
  }
} catch {
  console.error('SAFETY GUARD: TEST_DATABASE_URL is not a valid URL. Aborting.')
  process.exit(1)
}

function createMockReqRes(user) {
  const req = { user }
  let resStatus = 200
  let resJson = null

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
    throw err
  }

  return {
    req,
    res,
    next,
    getStatus: () => resStatus,
    getJson: () => resJson
  }
}

async function runTests() {
  console.log('====================================================')
  console.log('RUNNING AGRIRENT OWNER MY EQUIPMENT TESTS')
  console.log('====================================================\n')
  console.log(`Test database: ${new URL(TEST_DB_URL).host}\n`)

  const client = new Client({ connectionString: TEST_DB_URL })
  await client.connect()

  let passedCount = 0
  let failedCount = 0
  const tempUserIds = []
  const tempEqIds = []

  function pass(name) {
    passedCount++
    console.log(`  ✓ PASS: ${name}`)
  }

  function fail(name, error) {
    failedCount++
    console.error(`  ✗ FAIL: ${name}`)
    console.error(`    ${error.message || error}`)
  }

  try {
    const unique = Date.now()
    const ownerA = await client.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ($1, $2, $3, 'OWNER', 'dummyhash')
       RETURNING id, name, email`,
      [`Owner A ${unique}`, `owner_a_${unique}@test.internal`, `8880001${String(unique).slice(-4)}`]
    )
    const ownerB = await client.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ($1, $2, $3, 'OWNER', 'dummyhash')
       RETURNING id, name, email`,
      [`Owner B ${unique}`, `owner_b_${unique}@test.internal`, `8880002${String(unique).slice(-4)}`]
    )

    tempUserIds.push(ownerA.rows[0].id, ownerB.rows[0].id)
    const userA = ownerA.rows[0]
    const userB = ownerB.rows[0]

    const eqOwnerId = await client.query(
      `INSERT INTO equipment (name, category, price_per_day, city, state, owner, owner_id)
       VALUES ('Eq By Owner Id', 'Tractor', 1000, 'City', 'State', $1, $2)
       RETURNING id`,
      [userA.name, userA.id]
    )
    const eqLegacyName = await client.query(
      `INSERT INTO equipment (name, category, price_per_day, city, state, owner, owner_id)
       VALUES ('Eq Legacy Name', 'Tractor', 1100, 'City', 'State', $1, NULL)
       RETURNING id`,
      [userA.name]
    )
    const eqLegacyEmail = await client.query(
      `INSERT INTO equipment (name, category, price_per_day, city, state, owner, owner_id)
       VALUES ('Eq Legacy Email', 'Tractor', 1200, 'City', 'State', $1, NULL)
       RETURNING id`,
      [userA.email]
    )
    const eqOther = await client.query(
      `INSERT INTO equipment (name, category, price_per_day, city, state, owner, owner_id)
       VALUES ('Eq Other Owner', 'Tractor', 1300, 'City', 'State', $1, $2)
       RETURNING id`,
      [userB.name, userB.id]
    )
    const eqMislabeledOwner = await client.query(
      `INSERT INTO equipment (name, category, price_per_day, city, state, owner, owner_id)
       VALUES ('Eq Belongs To B With A Email Label', 'Tractor', 1400, 'City', 'State', $1, $2)
       RETURNING id`,
      [userA.email, userB.id]
    )

    tempEqIds.push(
      eqOwnerId.rows[0].id,
      eqLegacyName.rows[0].id,
      eqLegacyEmail.rows[0].id,
      eqOther.rows[0].id,
      eqMislabeledOwner.rows[0].id
    )

    // TEST 1: Owner A sees own listings (owner_id + legacy name + legacy email), not B's
    try {
      const { req, res, next, getStatus, getJson } = createMockReqRes({
        id: userA.id,
        role: 'OWNER',
        name: userA.name,
        email: userA.email
      })

      await equipmentController.getMyEquipment(req, res, next)
      assert.strictEqual(getStatus(), 200)
      const json = getJson()
      assert.ok(Array.isArray(json))
      const ids = json.map((e) => e.id).sort((a, b) => a - b)
      const expected = [
        eqOwnerId.rows[0].id,
        eqLegacyName.rows[0].id,
        eqLegacyEmail.rows[0].id
      ].sort((a, b) => a - b)
      assert.deepStrictEqual(ids, expected)
      assert.ok(json.every((e) => e.ownerId === userA.id || e.owner === userA.name || e.owner === userA.email))
      pass('1. getMyEquipment returns only authenticated owner listings')
    } catch (e) {
      fail('1. getMyEquipment returns only authenticated owner listings', e)
    }

    // TEST 2: JWT-shaped req.user (no name on token) still resolves name from DB for legacy rows
    try {
      const { req, res, next, getJson } = createMockReqRes({
        id: userA.id,
        role: 'OWNER',
        email: userA.email
      })

      await equipmentController.getMyEquipment(req, res, next)
      const ids = getJson().map((e) => e.id).sort((a, b) => a - b)
      const expected = [
        eqOwnerId.rows[0].id,
        eqLegacyName.rows[0].id,
        eqLegacyEmail.rows[0].id
      ].sort((a, b) => a - b)
      assert.deepStrictEqual(ids, expected)
      pass('2. DB-backed legacy name/email with JWT-shaped req.user')
    } catch (e) {
      fail('2. DB-backed legacy name/email with JWT-shaped req.user', e)
    }

    // TEST 3: Owner B sees only their equipment
    try {
      const { req, res, next, getJson } = createMockReqRes({
        id: userB.id,
        role: 'OWNER',
        name: userB.name,
        email: userB.email
      })

      await equipmentController.getMyEquipment(req, res, next)
      const json = getJson()
      const ids = json.map((e) => e.id).sort((a, b) => a - b)
      const expected = [eqOther.rows[0].id, eqMislabeledOwner.rows[0].id].sort((a, b) => a - b)
      assert.deepStrictEqual(ids, expected)
      pass('3. Owner B receives only rows with owner_id = B')
    } catch (e) {
      fail('3. Other owner receives only their listing', e)
    }

    // TEST 4: owner_id wins — legacy owner string must not expose another user's listing
    try {
      const { req, res, next, getJson } = createMockReqRes({
        id: userA.id,
        role: 'OWNER',
        email: userA.email
      })

      await equipmentController.getMyEquipment(req, res, next)
      const ids = getJson().map((e) => e.id)
      assert.ok(!ids.includes(eqMislabeledOwner.rows[0].id))
      pass('4. Does not return rows where owner_id belongs to another user')
    } catch (e) {
      fail('4. Does not return rows where owner_id belongs to another user', e)
    }
  } finally {
    if (tempEqIds.length > 0) {
      await client.query(`DELETE FROM equipment WHERE id = ANY($1::int[])`, [tempEqIds])
    }
    if (tempUserIds.length > 0) {
      await client.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [tempUserIds])
    }
    await client.end()
    console.log('\n✓ Cleanup complete.')
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

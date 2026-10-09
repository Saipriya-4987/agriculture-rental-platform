// Pure unit test (no database needed): ownership must depend on owner_id only.
const assert = require('assert')
const { isEquipmentOwner } = require('../utils/ownership')
const { validateTransitionAuth } = require('../utils/bookingStateMachine')

let failed = 0
function check(name, fn) {
  try { fn(); console.log('✅', name) } catch (e) { failed++; console.error('❌', name, '-', e.message) }
}

// Real owner is user 1 ("Ramesh"). Impostor is user 2 who registered with the same name.
const booking = {
  status: 'PENDING',
  farmer_id: 3,
  equipment: { owner_id: 1, owner: 'Ramesh Reddy' }
}
const realOwner = { id: 1, name: 'Ramesh Reddy', email: 'ramesh@x.com' }
const impostor = { id: 2, name: 'Ramesh Reddy', email: 'fake@x.com' }

check('isEquipmentOwner: matches owner_id', () => assert.strictEqual(isEquipmentOwner(booking.equipment, 1), true))
check('isEquipmentOwner: same display name does NOT grant ownership', () =>
  assert.strictEqual(isEquipmentOwner(booking.equipment, 2), false))
check('isEquipmentOwner: null owner_id never matches', () =>
  assert.strictEqual(isEquipmentOwner({ owner_id: null, owner: 'Ramesh Reddy' }, 2), false))
check('isEquipmentOwner: missing equipment / user id is false', () => {
  assert.strictEqual(isEquipmentOwner(undefined, 1), false)
  assert.strictEqual(isEquipmentOwner(booking.equipment, undefined), false)
})
check('real owner can confirm', () =>
  assert.strictEqual(validateTransitionAuth(booking, realOwner, 'CONFIRMED').allowed, true))
check('impostor with same name cannot confirm (403)', () => {
  const r = validateTransitionAuth(booking, impostor, 'CONFIRMED')
  assert.strictEqual(r.allowed, false)
  assert.strictEqual(r.statusCode, 403)
})
check('impostor with owner email string cannot act either', () => {
  const b = { ...booking, equipment: { owner_id: 1, owner: 'ramesh@x.com' } }
  const r = validateTransitionAuth(b, { id: 2, name: 'x', email: 'ramesh@x.com' }, 'CONFIRMED')
  assert.strictEqual(r.allowed, false)
})
check('farmer still limited to farmer actions', () =>
  assert.strictEqual(validateTransitionAuth({ ...booking, status: 'READY_FOR_HANDOVER' }, { id: 3 }, 'PICKED_UP').allowed, true))

if (failed) { console.error(`\n${failed} test(s) failed`); process.exit(1) }
console.log('\nAll ownership tests passed')
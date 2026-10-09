const assert = require('assert')
const { getJwtSecret, MIN_LENGTH } = require('../utils/jwtSecret')

let failed = 0
async function check(name, fn) {
  try {
    await fn()
    console.log('✅', name)
  } catch (e) {
    failed++
    console.error('❌', name, '-', e.message)
  }
}

(async () => {
  const originalEnv = process.env.JWT_SECRET

  await check('fails if JWT_SECRET is empty', async () => {
    process.env.JWT_SECRET = ''
    assert.throws(() => getJwtSecret(), /FATAL: JWT_SECRET environment variable must be set./)
  })

  await check('fails if JWT_SECRET is placeholder', async () => {
    process.env.JWT_SECRET = 'agrirent-default-super-secret-jwt-key'
    assert.throws(() => getJwtSecret(), /FATAL: JWT_SECRET is still a placeholder value./)
  })

  await check('fails if JWT_SECRET is too short', async () => {
    process.env.JWT_SECRET = 'short'
    assert.throws(() => getJwtSecret(), /FATAL: JWT_SECRET must be at least 32 characters long./)
  })

  await check('passes if JWT_SECRET is valid', async () => {
    process.env.JWT_SECRET = 'this_is_a_very_long_valid_secret_key_that_is_32_chars'
    assert.strictEqual(getJwtSecret(), process.env.JWT_SECRET)
  })

  // Restore env
  process.env.JWT_SECRET = originalEnv

  if (failed) {
    console.error(`\n${failed} test(s) failed`)
    process.exit(1)
  }
  console.log('\nAll jwtSecret tests passed')
})()

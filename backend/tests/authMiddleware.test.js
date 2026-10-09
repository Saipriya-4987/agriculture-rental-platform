// Unit test (no database): prisma is stubbed so we can test requireAuth rules.
const assert = require('assert')
const path = require('path')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123'
let dbUser = null
const clientPath = require.resolve(path.join('..', 'prisma', 'client'))
require.cache[clientPath] = {
  id: clientPath, filename: clientPath, loaded: true,
  exports: { user: { findUnique: async () => dbUser } }
}
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

function run(token) {
  return new Promise((resolve) => {
    const req = { headers: token ? { authorization: `Bearer ${token}` } : {}, header: () => undefined }
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this },
      json(b) { resolve({ status: this.statusCode, body: b, req }); return this }
    }
    requireAuth(req, res, (err) => resolve({ status: 'next', err, req }))
  })
}
const sign = (payload = {}, opts = {}) =>
  jwt.sign({ id: 1, role: 'FARMER', email: 'a@x.com', ...payload }, process.env.JWT_SECRET, { expiresIn: '7d', ...opts })
const activeUser = (extra = {}) => ({ id: 1, role: 'FARMER', email: 'a@x.com', status: 'ACTIVE', password_changed_at: null, ...extra })

let failed = 0
async function check(name, fn) {
  try { await fn(); console.log('✅', name) } catch (e) { failed++; console.error('❌', name, '-', e.message) }
}

;(async () => {
  await check('no token -> 401', async () => assert.strictEqual((await run(null)).status, 401))
  await check('garbage token -> 401', async () => assert.strictEqual((await run('abc.def.ghi')).status, 401))
  await check('valid token + active user -> next()', async () => {
    dbUser = activeUser()
    const r = await run(sign())
    assert.strictEqual(r.status, 'next')
    assert.strictEqual(r.req.user.id, 1)
  })
  await check('SUSPENDED user with valid token -> 403', async () => {
    dbUser = activeUser({ status: 'SUSPENDED' })
    assert.strictEqual((await run(sign())).status, 403)
  })
  await check('deleted user -> 401', async () => {
    dbUser = null
    assert.strictEqual((await run(sign())).status, 401)
  })
  await check('token issued BEFORE password change -> 401', async () => {
    const iat = Math.floor(Date.now() / 1000) - 3600
    dbUser = activeUser({ password_changed_at: new Date() })
    assert.strictEqual((await run(sign({ iat }))).status, 401)
  })
  await check('token issued AFTER password change -> next()', async () => {
    dbUser = activeUser({ password_changed_at: new Date(Date.now() - 3600 * 1000) })
    assert.strictEqual((await run(sign())).status, 'next')
  })
  await check('role comes from DB, not from the token', async () => {
    dbUser = activeUser({ role: 'OWNER' })
    const r = await run(sign({ role: 'ADMIN' }))
    assert.strictEqual(r.req.user.role, 'OWNER')
  })
  await check('requireRole still blocks wrong role (403)', async () => {
    let code
    const res = { status(c) { code = c; return this }, json() { return this } }
    requireRole('ADMIN')({ user: { role: 'FARMER' } }, res, () => {})
    assert.strictEqual(code, 403)
  })

  if (failed) { console.error(`\n${failed} test(s) failed`); process.exit(1) }
  console.log('\nAll auth middleware tests passed')
})()
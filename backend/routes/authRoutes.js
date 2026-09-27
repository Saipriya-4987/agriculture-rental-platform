const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// POST /api/auth/register (Public)
router.post('/register', register)

// POST /api/auth/login (Public)
router.post('/login', login)

// GET /api/auth/me (Protected via JWT Auth Middleware)
router.get('/me', requireAuth, getMe)

// GET /api/auth/farmer-test (Protected: FARMER only)
router.get('/farmer-test', requireAuth, requireRole('FARMER'), (req, res) => {
  res.json({
    message: 'Access granted to FARMER route',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  })
})

// GET /api/auth/owner-test (Protected: OWNER only)
router.get('/owner-test', requireAuth, requireRole('OWNER'), (req, res) => {
  res.json({
    message: 'Access granted to OWNER route',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  })
})

// GET /api/auth/admin-test (Protected: ADMIN only)
router.get('/admin-test', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({
    message: 'Access granted to ADMIN route',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  })
})

// GET /api/auth/partner-test (Protected: PARTNER only)
router.get('/partner-test', requireAuth, requireRole('PARTNER'), (req, res) => {
  res.json({
    message: 'Access granted to PARTNER route',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  })
})

module.exports = router

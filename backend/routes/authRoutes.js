const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')
const { requireAuth } = require('../middleware/authMiddleware')

// POST /api/auth/register (Public)
router.post('/register', register)

// POST /api/auth/login (Public)
router.post('/login', login)

// GET /api/auth/me (Protected via JWT Auth Middleware)
router.get('/me', requireAuth, getMe)

module.exports = router

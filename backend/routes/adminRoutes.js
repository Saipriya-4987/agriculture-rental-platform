const express = require('express')
const router = express.Router()
const {
  getUsers,
  suspendUser,
  reactivateUser
} = require('../controllers/adminController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// All admin routes require authentication and ADMIN role
router.use(requireAuth, requireRole('ADMIN'))

// GET /api/admin/users - Admin views all users
router.get('/users', getUsers)

// PATCH /api/admin/users/:id/suspend - Admin suspends a user
router.patch('/users/:id/suspend', suspendUser)

// PATCH /api/admin/users/:id/reactivate - Admin reactivates a user
router.patch('/users/:id/reactivate', reactivateUser)

module.exports = router

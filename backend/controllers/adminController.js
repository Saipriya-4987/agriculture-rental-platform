const prisma = require('../prisma/client')

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

const formatUser = (user) => {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}

/**
 * Admin view all users
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    })

    res.json(users.map(formatUser))
  } catch (err) {
    next(err)
  }
}

/**
 * Admin suspend a user
 * PATCH /api/admin/users/:id/suspend
 */
const suspendUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError('Invalid user ID', 400)

    // Safety guard: Admin cannot suspend their own account
    if (id === req.user.id) {
      throw new AppError('Cannot suspend your own admin account', 400)
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      throw new AppError('User not found', 404)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        updated_at: new Date()
      }
    })

    res.json({
      message: 'User suspended successfully',
      user: formatUser(updated)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Admin reactivate a suspended user
 * PATCH /api/admin/users/:id/reactivate
 */
const reactivateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError('Invalid user ID', 400)

    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      throw new AppError('User not found', 404)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        updated_at: new Date()
      }
    })

    res.json({
      message: 'User reactivated successfully',
      user: formatUser(updated)
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getUsers,
  suspendUser,
  reactivateUser,
  formatUser
}

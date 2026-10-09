const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')
const { getJwtSecret } = require('../utils/jwtSecret')

/**
 * Authentication middleware.
 * 1. Verifies the JWT in the Authorization header (Authorization: Bearer <token>).
 * 2. Loads the user from the database on every request so that:
 *    - SUSPENDED users are blocked immediately (even with a still-valid token),
 *    - tokens issued BEFORE a password change are rejected,
 *    - role changes take effect right away (role comes from the DB, not the token).
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.'
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Invalid authorization format.'
    })
  }

  // Read the secret OUTSIDE the try/catch: a missing/weak secret is a server
  // configuration error (500), not a bad token (401).
  const secret = getJwtSecret()

  let decoded
  try {
    decoded = jwt.verify(token, secret)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please log in again.'
      })
    }

    return res.status(401).json({
      error: 'Invalid token. Authentication failed.'
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, status: true, password_changed_at: true }
    })

    if (!user) {
      return res.status(401).json({
        error: 'Account no longer exists. Please log in again.'
      })
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.'
      })
    }

    // Reject tokens issued before the last password change (compare in whole seconds,
    // because the JWT "iat" claim has 1-second precision).
    if (user.password_changed_at && decoded.iat) {
      const changedAtSeconds = Math.floor(new Date(user.password_changed_at).getTime() / 1000)
      if (decoded.iat < changedAtSeconds) {
        return res.status(401).json({
          error: 'Session expired because your password was changed. Please log in again.'
        })
      }
    }

    // Attach authenticated user information to request (role taken from the DB)
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Role-based authorization middleware.
 * Reads authenticated user role from req.user and checks against allowed roles.
 * Usage: requireRole('FARMER'), requireRole('OWNER', 'ADMIN'), etc.
 */
const requireRole = (...roles) => {
  const allowedRoles = roles.flat().map(r => String(r).toUpperCase())

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Authentication required. No user context found.'
      })
    }

    const userRole = String(req.user.role).toUpperCase()
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      })
    }

    next()
  }
}

module.exports = {
  requireAuth,
  requireRole
}
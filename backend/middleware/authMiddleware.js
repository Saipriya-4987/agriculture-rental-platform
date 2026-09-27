const jwt = require('jsonwebtoken')

const getJwtSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production.')
  }
  return process.env.JWT_SECRET || 'agrirent-default-super-secret-jwt-key'
}

/**
 * Authentication middleware that verifies JWT in the Authorization header.
 * Expects: Authorization: Bearer <token>
 */
const requireAuth = (req, res, next) => {
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

  try {
    const decoded = jwt.verify(token, getJwtSecret())

    // Attach authenticated user information to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    }

    next()
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

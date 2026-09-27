const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'agrirent-default-super-secret-jwt-key'

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
    const decoded = jwt.verify(token, JWT_SECRET)

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

module.exports = {
  requireAuth
}

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const equipmentRoutes = require('./routes/equipmentRoutes')
const authRoutes = require('./routes/authRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const adminRoutes = require('./routes/adminRoutes')
const { errorHandler } = require('./middleware/errorHandler')
const { requestLogger } = require('./middleware/requestLogger')
const { getJwtSecret } = require('./utils/jwtSecret')

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Production CORS Configuration: supports environment variables and future Vercel deployments
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [])
]

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl)
    if (!origin) return callback(null, true)

    const isExplicitlyAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*')
    const isVercelDomain = origin.endsWith('.vercel.app')
    const isLocalhost = process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
      return callback(null, true)
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true
}

// Middleware
app.use(express.json())
app.use(cors(corsOptions))
app.use(requestLogger)

// Production health check endpoints for load balancers and platform monitors
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'AgriRent API is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Equipment routes
app.use('/api/equipment', equipmentRoutes)

// Booking routes
app.use('/api/bookings', bookingRoutes)

// Review routes
app.use('/api/reviews', reviewRoutes)

// Admin routes
app.use('/api/admin', adminRoutes)

// 404 handler for all unknown routes (must be before errorHandler)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})

// Centralized error handling middleware (must be last)
app.use(errorHandler)

// Start server on 0.0.0.0 and PORT
if (require.main === module) {
  // Fail fast: refuse to start without a strong JWT_SECRET
  getJwtSecret()

  app.listen(PORT, HOST, () => {
    console.log(`AgriRent API server running on http://${HOST}:${PORT}`)
  })
}

module.exports = app
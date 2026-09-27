const express = require('express')
const cors = require('cors')
const equipmentRoutes = require('./routes/equipmentRoutes')
const authRoutes = require('./routes/authRoutes')
const { errorHandler } = require('./middleware/errorHandler')
const { requestLogger } = require('./middleware/requestLogger')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(requestLogger)

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriRent API is running' })
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Equipment routes
app.use('/api/equipment', equipmentRoutes)

// 404 handler for all unknown routes (must be before errorHandler)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})

// Centralized error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`AgriRent API server running on http://localhost:${PORT}`)
})

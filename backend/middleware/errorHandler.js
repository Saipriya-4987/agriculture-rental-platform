// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  // Handle PostgreSQL exclusion constraint violations (SQLSTATE 23P01)
  if (
    err.code === '23P01' ||
    (err.message && (err.message.includes('23P01') || err.message.includes('bookings_no_overlap') || err.message.includes('exclusion constraint')))
  ) {
    return res.status(409).json({
      error: 'Equipment is already booked for those dates.'
    })
  }

  // Default error response
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = {
  errorHandler
}

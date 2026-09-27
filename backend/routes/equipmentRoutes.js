const express = require('express')
const router = express.Router()
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController')
const { getEquipmentReviews } = require('../controllers/reviewController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')

// Public GET routes
// GET /api/equipment
router.get('/', getAllEquipment)

// GET /api/equipment/:id
router.get('/:id', getEquipmentById)

// GET /api/equipment/:id/reviews
router.get('/:id/reviews', getEquipmentReviews)

// Protected Write routes: OWNER only
// POST /api/equipment
router.post('/', requireAuth, requireRole('OWNER'), createEquipment)

// PUT /api/equipment/:id
router.put('/:id', requireAuth, requireRole('OWNER'), updateEquipment)

// DELETE /api/equipment/:id
router.delete('/:id', requireAuth, requireRole('OWNER'), deleteEquipment)

module.exports = router

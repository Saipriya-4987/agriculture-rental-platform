const express = require('express')
const router = express.Router()
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController')

// GET /api/equipment
router.get('/', getAllEquipment)

// GET /api/equipment/:id
router.get('/:id', getEquipmentById)

// POST /api/equipment
router.post('/', createEquipment)

// PUT /api/equipment/:id
router.put('/:id', updateEquipment)

// DELETE /api/equipment/:id
router.delete('/:id', deleteEquipment)

module.exports = router

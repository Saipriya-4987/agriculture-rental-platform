const { equipment } = require('../data/equipmentData')

// Custom error class for better error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

// GET all equipment
const getAllEquipment = (req, res, next) => {
  try {
    res.json(equipment)
  } catch (err) {
    next(err)
  }
}

// GET single equipment by ID
const getEquipmentById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const item = equipment.find((e) => e.id === id)

    if (!item) {
      throw new AppError('Equipment not found', 404)
    }

    res.json(item)
  } catch (err) {
    next(err)
  }
}

// POST create new equipment
const createEquipment = (req, res, next) => {
  try {
    const {
      name,
      category,
      categoryValue,
      state,
      stateValue,
      district,
      districtValue,
      village,
      villageValue,
      city,
      pricePerDay,
      image,
      imageAlt,
      availabilityFrom,
      availabilityTo,
      owner,
      rating,
      ratingCount,
      description,
      features,
      availability
    } = req.body

    // Basic validation
    if (!name || !category || !state || !city || !pricePerDay) {
      throw new AppError('Missing required fields', 400)
    }

    const newId = equipment.length > 0 ? Math.max(...equipment.map((e) => e.id)) + 1 : 1

    const newEquipment = {
      id: newId,
      name,
      category,
      categoryValue: categoryValue || category.toLowerCase(),
      state,
      stateValue: stateValue || state.toLowerCase().replace(/\s+/g, '-'),
      district: district || '',
      districtValue: districtValue || '',
      village: village || '',
      villageValue: villageValue || '',
      city,
      pricePerDay: Number(pricePerDay),
      image: image || 'https://placehold.co/400x300?text=Equipment',
      imageAlt: imageAlt || name,
      availabilityFrom: availabilityFrom || '2024-01-01',
      availabilityTo: availabilityTo || '2024-12-31',
      owner: owner || 'Unknown',
      rating: rating || 0,
      ratingCount: ratingCount || 0,
      description: description || '',
      features: features || [],
      availability: availability || []
    }

    equipment.push(newEquipment)
    res.status(201).json(newEquipment)
  } catch (err) {
    next(err)
  }
}

// PUT update equipment
const updateEquipment = (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const index = equipment.findIndex((e) => e.id === id)

    if (index === -1) {
      throw new AppError('Equipment not found', 404)
    }

    const updatedEquipment = {
      ...equipment[index],
      ...req.body,
      id // Ensure ID cannot be changed
    }

    equipment[index] = updatedEquipment
    res.json(updatedEquipment)
  } catch (err) {
    next(err)
  }
}

// DELETE equipment
const deleteEquipment = (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const index = equipment.findIndex((e) => e.id === id)

    if (index === -1) {
      throw new AppError('Equipment not found', 404)
    }

    equipment.splice(index, 1)
    res.json({ message: 'Equipment deleted successfully' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
}

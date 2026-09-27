const db = require('../db')

// Custom error class for better error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

// Helper to format PostgreSQL row to JSON equipment object
const formatEquipmentRow = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryValue: row.category_value || '',
    state: row.state,
    stateValue: row.state_value || '',
    district: row.district || '',
    districtValue: row.district_value || '',
    village: row.village || '',
    villageValue: row.village_value || '',
    city: row.city,
    pricePerDay: Number(row.price_per_day),
    image: row.image || '',
    imageAlt: row.image_alt || '',
    availabilityFrom: row.availability_from
      ? (typeof row.availability_from === 'string'
          ? row.availability_from.split('T')[0]
          : row.availability_from.toISOString().split('T')[0])
      : '',
    availabilityTo: row.availability_to
      ? (typeof row.availability_to === 'string'
          ? row.availability_to.split('T')[0]
          : row.availability_to.toISOString().split('T')[0])
      : '',
    owner: row.owner || '',
    rating: Number(row.rating || 0),
    ratingCount: Number(row.rating_count || 0),
    description: row.description || '',
    features: row.features || [],
    availability: row.availability || []
  }
}

// GET all equipment (SELECT)
const getAllEquipment = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM equipment ORDER BY id ASC')
    res.json(result.rows.map(formatEquipmentRow))
  } catch (err) {
    next(err)
  }
}

// GET single equipment by ID (SELECT ... WHERE id)
const getEquipmentById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const result = await db.query('SELECT * FROM equipment WHERE id = $1', [id])

    if (result.rows.length === 0) {
      throw new AppError('Equipment not found', 404)
    }

    res.json(formatEquipmentRow(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

// POST create new equipment (INSERT)
const createEquipment = async (req, res, next) => {
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

    const catVal = categoryValue || category.toLowerCase()
    const stVal = stateValue || state.toLowerCase().replace(/\s+/g, '-')
    const dist = district || ''
    const distVal = districtValue || ''
    const vill = village || ''
    const villVal = villageValue || ''
    const img = image || 'https://placehold.co/400x300?text=Equipment'
    const imgAlt = imageAlt || name
    const availFrom = availabilityFrom || '2024-01-01'
    const availTo = availabilityTo || '2024-12-31'
    const own = owner || 'Unknown'
    const rat = rating || 0
    const ratCount = ratingCount || 0
    const desc = description || ''
    const feat = features || []
    const avail = availability || []

    const insertSql = `
      INSERT INTO equipment (
        name, category, category_value, state, state_value, district, district_value,
        village, village_value, city, price_per_day, image, image_alt,
        availability_from, availability_to, owner, rating, rating_count,
        description, features, availability
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21
      ) RETURNING *
    `

    const values = [
      name, category, catVal, state, stVal, dist, distVal,
      vill, villVal, city, Number(pricePerDay), img, imgAlt,
      availFrom, availTo, own, rat, ratCount,
      desc, feat, avail
    ]

    const result = await db.query(insertSql, values)
    res.status(201).json(formatEquipmentRow(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

// PUT update equipment (UPDATE)
const updateEquipment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    // Check if equipment exists
    const existingRes = await db.query('SELECT * FROM equipment WHERE id = $1', [id])
    if (existingRes.rows.length === 0) {
      throw new AppError('Equipment not found', 404)
    }

    const current = existingRes.rows[0]

    // Merge request body with current fields
    const updated = {
      name: req.body.name !== undefined ? req.body.name : current.name,
      category: req.body.category !== undefined ? req.body.category : current.category,
      category_value: req.body.categoryValue !== undefined ? req.body.categoryValue : (req.body.category ? req.body.category.toLowerCase() : current.category_value),
      state: req.body.state !== undefined ? req.body.state : current.state,
      state_value: req.body.stateValue !== undefined ? req.body.stateValue : (req.body.state ? req.body.state.toLowerCase().replace(/\s+/g, '-') : current.state_value),
      district: req.body.district !== undefined ? req.body.district : current.district,
      district_value: req.body.districtValue !== undefined ? req.body.districtValue : current.district_value,
      village: req.body.village !== undefined ? req.body.village : current.village,
      village_value: req.body.villageValue !== undefined ? req.body.villageValue : current.village_value,
      city: req.body.city !== undefined ? req.body.city : current.city,
      price_per_day: req.body.pricePerDay !== undefined ? Number(req.body.pricePerDay) : current.price_per_day,
      image: req.body.image !== undefined ? req.body.image : current.image,
      image_alt: req.body.imageAlt !== undefined ? req.body.imageAlt : current.image_alt,
      availability_from: req.body.availabilityFrom !== undefined ? req.body.availabilityFrom : current.availability_from,
      availability_to: req.body.availabilityTo !== undefined ? req.body.availabilityTo : current.availability_to,
      owner: req.body.owner !== undefined ? req.body.owner : current.owner,
      rating: req.body.rating !== undefined ? req.body.rating : current.rating,
      rating_count: req.body.ratingCount !== undefined ? req.body.ratingCount : current.rating_count,
      description: req.body.description !== undefined ? req.body.description : current.description,
      features: req.body.features !== undefined ? req.body.features : current.features,
      availability: req.body.availability !== undefined ? req.body.availability : current.availability
    }

    const updateSql = `
      UPDATE equipment SET
        name = $1, category = $2, category_value = $3, state = $4, state_value = $5,
        district = $6, district_value = $7, village = $8, village_value = $9,
        city = $10, price_per_day = $11, image = $12, image_alt = $13,
        availability_from = $14, availability_to = $15, owner = $16,
        rating = $17, rating_count = $18, description = $19, features = $20,
        availability = $21
      WHERE id = $22
      RETURNING *
    `

    const values = [
      updated.name, updated.category, updated.category_value, updated.state, updated.state_value,
      updated.district, updated.district_value, updated.village, updated.village_value,
      updated.city, updated.price_per_day, updated.image, updated.image_alt,
      updated.availability_from, updated.availability_to, updated.owner,
      updated.rating, updated.rating_count, updated.description, updated.features,
      updated.availability, id
    ]

    const result = await db.query(updateSql, values)
    res.json(formatEquipmentRow(result.rows[0]))
  } catch (err) {
    next(err)
  }
}

// DELETE equipment (DELETE)
const deleteEquipment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const result = await db.query('DELETE FROM equipment WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      throw new AppError('Equipment not found', 404)
    }

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

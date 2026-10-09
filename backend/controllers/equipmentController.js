const prisma = require('../prisma/client')

// Custom error class for better error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

// Helper to format Prisma equipment model to JSON equipment object
const formatEquipment = (item) => {
  if (!item) return null
  return {
    id: item.id,
    ownerId: item.owner_id || null,
    name: item.name,
    category: item.category,
    categoryValue: item.category_value || '',
    state: item.state,
    stateValue: item.state_value || '',
    district: item.district || '',
    districtValue: item.district_value || '',
    village: item.village || '',
    villageValue: item.village_value || '',
    city: item.city,
    pricePerDay: Number(item.price_per_day),
    image: item.image || '',
    imageAlt: item.image_alt || '',
    availabilityFrom: item.availability_from
      ? (typeof item.availability_from === 'string'
          ? item.availability_from.split('T')[0]
          : item.availability_from.toISOString().split('T')[0])
      : '',
    availabilityTo: item.availability_to
      ? (typeof item.availability_to === 'string'
          ? item.availability_to.split('T')[0]
          : item.availability_to.toISOString().split('T')[0])
      : '',
    owner: item.owner || '',
    rating: Number(item.rating || 0),
    ratingCount: Number(item.rating_count || 0),
    description: item.description || '',
    features: item.features || [],
    availability: item.availability || [],
    reservedRanges: item.bookings && Array.isArray(item.bookings)
      ? item.bookings.map((b) => ({
          startDate: typeof b.start_date === 'string'
            ? b.start_date.split('T')[0]
            : b.start_date.toISOString().split('T')[0],
          endDate: typeof b.end_date === 'string'
            ? b.end_date.split('T')[0]
            : b.end_date.toISOString().split('T')[0]
        }))
      : []
  }
}

// Build Prisma where clause for equipment owned by the authenticated user.
const buildOwnerEquipmentWhere = (user) => {
  const orConditions = [{ owner_id: user.id }]

  const name =
    user.name != null && String(user.name).trim() !== '' ? String(user.name).trim() : null
  const email =
    user.email != null && String(user.email).trim() !== '' ? String(user.email).trim() : null

  const legacyOwnerMatches = []
  if (name) {
    legacyOwnerMatches.push({ owner: name })
  }
  if (email) {
    legacyOwnerMatches.push({ owner: email })
  }

  // Legacy string match only when owner_id is unset (same rule as update/delete).
  if (legacyOwnerMatches.length > 0) {
    orConditions.push({
      AND: [{ owner_id: null }, { OR: legacyOwnerMatches }]
    })
  }

  return { OR: orConditions }
}

// GET equipment listings for the authenticated owner
// GET /api/equipment/mine
const getMyEquipment = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const items = await prisma.equipment.findMany({
      where: buildOwnerEquipmentWhere(user),
      orderBy: { id: 'asc' }
    })

    res.json(items.map(formatEquipment))
  } catch (err) {
    next(err)
  }
}

// GET all equipment (Prisma findMany)
const getAllEquipment = async (req, res, next) => {
  try {
    const items = await prisma.equipment.findMany({
      orderBy: { id: 'asc' }
    })
    res.json(items.map(formatEquipment))
  } catch (err) {
    next(err)
  }
}

// GET single equipment by ID (Prisma findUnique)
const getEquipmentById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const item = await prisma.equipment.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED']
            }
          },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true
          }
        }
      }
    })

    if (!item) {
      throw new AppError('Equipment not found', 404)
    }

    res.json(formatEquipment(item))
  } catch (err) {
    next(err)
  }
}

// POST create new equipment (Prisma create)
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

    // Determine owner display name and owner_id from authenticated user
    const ownerId = req.user ? req.user.id : null
    let ownerDisplayName = owner
    if (!ownerDisplayName && req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, email: true }
      })
      ownerDisplayName = user?.name || user?.email || 'Owner'
    }

    const created = await prisma.equipment.create({
      data: {
        owner_id: ownerId,
        name,
        category,
        category_value: categoryValue || category.toLowerCase(),
        state,
        state_value: stateValue || state.toLowerCase().replace(/\s+/g, '-'),
        district: district || '',
        district_value: districtValue || '',
        village: village || '',
        village_value: villageValue || '',
        city,
        price_per_day: pricePerDay,
        image: image || 'https://placehold.co/400x300?text=Equipment',
        image_alt: imageAlt || name,
        availability_from: availabilityFrom ? new Date(availabilityFrom) : new Date('2024-01-01'),
        availability_to: availabilityTo ? new Date(availabilityTo) : new Date('2024-12-31'),
        owner: ownerDisplayName || 'Unknown',
        rating: rating || 0,
        rating_count: ratingCount || 0,
        description: description || '',
        features: features || [],
        availability: availability || []
      }
    })

    res.status(201).json(formatEquipment(created))
  } catch (err) {
    next(err)
  }
}

// PUT update equipment (Prisma update)
const updateEquipment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const existing = await prisma.equipment.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError('Equipment not found', 404)
    }

    // Ownership check: OWNER can modify only their own equipment
    let isOwner = false
    if (existing.owner_id) {
      isOwner = existing.owner_id === req.user.id
    } else {
      // Legacy / seeded check: verify against user name or email
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, email: true }
      })
      isOwner = Boolean(user && (user.name === existing.owner || user.email === existing.owner))
    }

    if (!isOwner) {
      throw new AppError('Forbidden: You can only modify your own equipment listings.', 403)
    }

    const dataToUpdate = {}
    if (req.body.name !== undefined) dataToUpdate.name = req.body.name
    if (req.body.category !== undefined) {
      dataToUpdate.category = req.body.category
      dataToUpdate.category_value = req.body.categoryValue !== undefined ? req.body.categoryValue : req.body.category.toLowerCase()
    } else if (req.body.categoryValue !== undefined) {
      dataToUpdate.category_value = req.body.categoryValue
    }

    if (req.body.state !== undefined) {
      dataToUpdate.state = req.body.state
      dataToUpdate.state_value = req.body.stateValue !== undefined ? req.body.stateValue : req.body.state.toLowerCase().replace(/\s+/g, '-')
    } else if (req.body.stateValue !== undefined) {
      dataToUpdate.state_value = req.body.stateValue
    }

    if (req.body.district !== undefined) dataToUpdate.district = req.body.district
    if (req.body.districtValue !== undefined) dataToUpdate.district_value = req.body.districtValue
    if (req.body.village !== undefined) dataToUpdate.village = req.body.village
    if (req.body.villageValue !== undefined) dataToUpdate.village_value = req.body.villageValue
    if (req.body.city !== undefined) dataToUpdate.city = req.body.city
    if (req.body.pricePerDay !== undefined) dataToUpdate.price_per_day = req.body.pricePerDay
    if (req.body.image !== undefined) dataToUpdate.image = req.body.image
    if (req.body.imageAlt !== undefined) dataToUpdate.image_alt = req.body.imageAlt
    if (req.body.availabilityFrom !== undefined) dataToUpdate.availability_from = new Date(req.body.availabilityFrom)
    if (req.body.availabilityTo !== undefined) dataToUpdate.availability_to = new Date(req.body.availabilityTo)
    if (req.body.owner !== undefined) dataToUpdate.owner = req.body.owner
    if (req.body.rating !== undefined) dataToUpdate.rating = req.body.rating
    if (req.body.ratingCount !== undefined) dataToUpdate.rating_count = req.body.ratingCount
    if (req.body.description !== undefined) dataToUpdate.description = req.body.description
    if (req.body.features !== undefined) dataToUpdate.features = req.body.features
    if (req.body.availability !== undefined) dataToUpdate.availability = req.body.availability

    const updated = await prisma.equipment.update({
      where: { id },
      data: dataToUpdate
    })

    res.json(formatEquipment(updated))
  } catch (err) {
    next(err)
  }
}

// DELETE equipment (Prisma delete)
const deleteEquipment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      throw new AppError('Invalid equipment ID', 400)
    }

    const existing = await prisma.equipment.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError('Equipment not found', 404)
    }

    // Ownership check: OWNER can delete only their own equipment
    let isOwner = false
    if (existing.owner_id) {
      isOwner = existing.owner_id === req.user.id
    } else {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, email: true }
      })
      isOwner = Boolean(user && (user.name === existing.owner || user.email === existing.owner))
    }

    if (!isOwner) {
      throw new AppError('Forbidden: You can only delete your own equipment listings.', 403)
    }

    await prisma.equipment.delete({
      where: { id }
    })

    res.json({ message: 'Equipment deleted successfully' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getMyEquipment,
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
}

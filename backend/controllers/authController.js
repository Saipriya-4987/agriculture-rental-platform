const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const prisma = require('../prisma/client')

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

const getJwtSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production.')
  }
  return process.env.JWT_SECRET || 'agrirent-default-super-secret-jwt-key'
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?\d{10,15}$/

/**
 * Register a new user (FARMER or OWNER only).
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body

    // 1. Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('Full name is required', 400)
    }
    if (name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters long', 400)
    }

    // 2. Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new AppError('Email address is required', 400)
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError('Please enter a valid email address', 400)
    }

    // 3. Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      throw new AppError('Phone number is required', 400)
    }
    const cleanedPhone = phone.trim().replace(/[\s-]/g, '')
    if (!PHONE_REGEX.test(cleanedPhone)) {
      throw new AppError('Please enter a valid phone number (10-15 digits)', 400)
    }

    // 4. Validate password
    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400)
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400)
    }

    // 5. Validate role (allow only FARMER and OWNER; reject ADMIN and PARTNER)
    if (!role || typeof role !== 'string') {
      throw new AppError('Role is required (FARMER or OWNER)', 400)
    }
    const normalizedRole = role.trim().toUpperCase()
    if (!['FARMER', 'OWNER'].includes(normalizedRole)) {
      if (['ADMIN', 'PARTNER'].includes(normalizedRole)) {
        throw new AppError('Registration with this role is not permitted', 403)
      }
      throw new AppError('Invalid role. Only FARMER and OWNER roles are allowed', 400)
    }

    // 6. Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })
    if (existingEmail) {
      throw new AppError('Email is already registered', 409)
    }

    // 7. Check duplicate phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: cleanedPhone }
    })
    if (existingPhone) {
      throw new AppError('Phone number is already registered', 409)
    }

    // 8. Hash password securely with bcrypt
    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)

    // 9. Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanedPhone,
        password_hash,
        role: normalizedRole,
        status: 'ACTIVE'
      }
    })

    // 10. Return safe user data without password_hash
    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: safeUser
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Log in an existing user with JWT.
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, identifier, password } = req.body

    const loginIdentifier = (email || identifier || '').trim().toLowerCase()

    // 1. Validate inputs
    if (!loginIdentifier) {
      throw new AppError('Email is required', 400)
    }

    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400)
    }

    // 2. Find user by email using Prisma (also allow matching phone if entered)
    let user = await prisma.user.findUnique({
      where: { email: loginIdentifier }
    })

    if (!user && /^\+?\d{10,15}$/.test(loginIdentifier)) {
      user = await prisma.user.findUnique({
        where: { phone: loginIdentifier }
      })
    }

    // 3. Reject unknown user safely
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401)
    }

    // 5. Generate signed JWT containing user id and role
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    )

    // 6. Return token + safe user data without password_hash
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get current authenticated user details.
 * GET /api/auth/me (Protected via requireAuth)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    res.json({
      user: safeUser
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  getMe
}

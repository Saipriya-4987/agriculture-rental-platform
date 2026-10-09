/**
 * Single source of truth for the JWT signing secret.
 *
 * There is NO fallback value: if JWT_SECRET is missing, too short, or still a
 * known placeholder, we refuse to run. A default secret would let anyone forge
 * tokens (including ADMIN tokens).
 */
const MIN_LENGTH = 32

const PLACEHOLDERS = [
  'agrirent-default-super-secret-jwt-key',
  'your_super_secret_jwt_key_here_minimum_32_characters'
]

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.trim() === '') {
    throw new Error('FATAL: JWT_SECRET environment variable must be set.')
  }
  if (PLACEHOLDERS.includes(secret)) {
    throw new Error('FATAL: JWT_SECRET is still a placeholder value. Generate a real random secret.')
  }
  if (secret.length < MIN_LENGTH) {
    throw new Error(`FATAL: JWT_SECRET must be at least ${MIN_LENGTH} characters long.`)
  }

  return secret
}

module.exports = { getJwtSecret, MIN_LENGTH }
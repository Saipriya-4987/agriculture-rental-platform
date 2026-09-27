export interface Equipment {
  id: number
  name: string
  category: string
  categoryValue?: string
  state: string
  stateValue?: string
  district?: string
  districtValue?: string
  village?: string
  villageValue?: string
  city: string
  pricePerDay: number
  image: string
  imageAlt: string
  availabilityFrom?: string
  availabilityTo?: string
  owner?: string
  rating?: number
  ratingCount?: number
  description?: string
  features?: string[]
  availability?: string[]
  availabilityNote?: string
}

export interface CreateEquipmentData {
  name: string
  category: string
  categoryValue?: string
  state: string
  stateValue?: string
  district?: string
  districtValue?: string
  village?: string
  villageValue?: string
  city: string
  pricePerDay: number
  image?: string
  imageAlt?: string
  availabilityFrom?: string
  availabilityTo?: string
  owner?: string
  rating?: number
  ratingCount?: number
  description?: string
  features?: string[]
  availability?: string[]
}

export type UpdateEquipmentData = Partial<CreateEquipmentData>

export interface DeleteEquipmentResponse {
  message: string
}

export interface RegisterUserData {
  name: string
  email: string
  phone: string
  password: string
  role: 'FARMER' | 'OWNER' | string
}

export interface SafeUser {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export interface RegisterResponse {
  message: string
  user: SafeUser
}

export interface LoginCredentials {
  email?: string
  identifier?: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: SafeUser
}

/**
 * Custom API Error class with HTTP status code and optional details.
 */
export class ApiError extends Error {
  statusCode: number
  details?: unknown

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Centralized HTTP request helper with unified error extraction and network handling.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  let response: Response

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to the AgriRent server. Please ensure the backend is running and reachable.',
      0,
      networkError
    )
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    let errorData: unknown = null

    try {
      errorData = await response.json()
      if (errorData && typeof errorData === 'object' && 'error' in errorData) {
        errorMessage = String((errorData as { error: string }).error)
      } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = String((errorData as { message: string }).message)
      }
    } catch {
      // Non-JSON response body or empty
    }

    throw new ApiError(errorMessage, response.status, errorData)
  }

  return response.json()
}

/**
 * Fetch all equipment from the backend API.
 */
export async function getEquipmentList(): Promise<Equipment[]> {
  return apiRequest<Equipment[]>('/equipment')
}

/**
 * Fetch a single equipment item by its ID.
 */
export async function getEquipmentById(id: string | number): Promise<Equipment> {
  return apiRequest<Equipment>(`/equipment/${id}`)
}

/**
 * Create a new equipment listing.
 */
export async function createEquipment(data: CreateEquipmentData): Promise<Equipment> {
  return apiRequest<Equipment>('/equipment', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing equipment listing.
 */
export async function updateEquipment(
  id: string | number,
  data: UpdateEquipmentData
): Promise<Equipment> {
  return apiRequest<Equipment>(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Delete an equipment listing.
 */
export async function deleteEquipment(id: string | number): Promise<DeleteEquipmentResponse> {
  return apiRequest<DeleteEquipmentResponse>(`/equipment/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Register a new user account (FARMER or OWNER).
 */
export async function registerUser(data: RegisterUserData): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Log in an existing user with JWT.
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  if (response.token && response.user) {
    setAuthSession(response.token, response.user)
  }

  return response
}

/**
 * Store authenticated JWT and user in localStorage.
 */
export function setAuthSession(token: string, user: SafeUser): void {
  localStorage.setItem('agrirent_token', token)
  localStorage.setItem('agrirent_user', JSON.stringify(user))
}

/**
 * Retrieve the current JWT token.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('agrirent_token')
}

/**
 * Retrieve the current authenticated user.
 */
export function getAuthUser(): SafeUser | null {
  const raw = localStorage.getItem('agrirent_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as SafeUser
  } catch {
    return null
  }
}

/**
 * Clear the current authentication session.
 */
export function clearAuthSession(): void {
  localStorage.removeItem('agrirent_token')
  localStorage.removeItem('agrirent_user')
}

/**
 * Check if a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}

export const authApi = {
  register: registerUser,
  login: loginUser,
  setAuthSession,
  getAuthToken,
  getAuthUser,
  clearAuthSession,
  isAuthenticated,
}

export const equipmentApi = {
  getAll: getEquipmentList,
  getById: getEquipmentById,
  create: createEquipment,
  update: updateEquipment,
  delete: deleteEquipment,
}

export default {
  ...equipmentApi,
  ...authApi,
}

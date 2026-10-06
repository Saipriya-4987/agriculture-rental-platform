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

export interface AgreementAcceptance {
  bookingId: number
  agreementVersion: string
  acceptedBy: number
  acceptedAt: string
}

export interface CreateBookingData {
  equipmentId: number
  startDate: string
  endDate: string
  handoverMethod?: 'PICKUP' | 'DELIVERY' | string
  agreementAccepted: boolean
}

export interface Review {
  id: number
  bookingId: number
  reviewerId: number
  equipmentId: number
  rating: number
  comment?: string | null
  createdAt?: string
  reviewer?: {
    id: number
    name: string
  }
}

export interface CreateReviewData {
  bookingId: number
  rating: number
  comment?: string
}

export interface CreateReviewResponse {
  message: string
  review: Review
}

export interface Booking {
  id: number
  equipmentId: number
  farmerId: number
  startDate: string
  endDate: string
  totalDays: number
  totalAmount: number
  handoverMethod: 'PICKUP' | 'DELIVERY' | string
  status: string
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
  equipment?: Partial<Equipment>
  farmer?: Partial<SafeUser>
  reviews?: Review[]
  isReviewed?: boolean
  agreementAcceptance?: AgreementAcceptance
}

export interface CreateBookingResponse {
  message: string
  booking: Booking
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

  const token = getAuthToken()
  const defaultAuthHeaders: Record<string, string> = {}
  if (token) {
    defaultAuthHeaders.Authorization = `Bearer ${token}`
  }

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...defaultAuthHeaders,
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
 * Fetch current authenticated user from protected /auth/me endpoint.
 */
export async function getCurrentUser(): Promise<{ user: SafeUser }> {
  return apiRequest<{ user: SafeUser }>('/auth/me')
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

/**
 * Retrieve the current authenticated user's role.
 */
export function getUserRole(): string | null {
  const user = getAuthUser()
  return user?.role || null
}

/**
 * Check if the currently authenticated user possesses one of the specified roles.
 */
export function hasRole(...roles: string[]): boolean {
  const userRole = getUserRole()
  if (!userRole) return false
  return roles.map(r => r.toUpperCase()).includes(userRole.toUpperCase())
}

export const authApi = {
  register: registerUser,
  login: loginUser,
  getCurrentUser,
  setAuthSession,
  getAuthToken,
  getAuthUser,
  getUserRole,
  hasRole,
  clearAuthSession,
  isAuthenticated,
}

/**
 * Create a new booking request for an equipment.
 * POST /api/bookings
 */
export async function createBooking(data: CreateBookingData): Promise<CreateBookingResponse> {
  return apiRequest<CreateBookingResponse>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface BookingFilterParams {
  status?: string
  type?: 'current' | 'past' | 'all'
}

/**
 * Fetch the authenticated farmer's bookings with optional status filtering.
 * GET /api/bookings/my
 */
export async function getMyBookings(params?: BookingFilterParams): Promise<Booking[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.type && params.type !== 'all') query.set('type', params.type)
  const queryString = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<Booking[]>(`/bookings/my${queryString}`)
}

/**
 * Fetch bookings for equipment owned by authenticated owner with optional status filtering.
 * GET /api/bookings/owner
 */
export async function getOwnerBookings(params?: BookingFilterParams): Promise<Booking[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.type && params.type !== 'all') query.set('type', params.type)
  const queryString = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<Booking[]>(`/bookings/owner${queryString}`)
}

/**
 * Update booking status with optional rejection reason.
 * PATCH /api/bookings/:id/status
 */
export async function updateBookingStatus(
  id: number,
  status: string,
  rejectionReason?: string
): Promise<{ message: string; booking: Booking }> {
  return apiRequest<{ message: string; booking: Booking }>(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejectionReason }),
  })
}

/**
 * Confirm a pending booking (Owner action)
 */
export async function confirmBooking(id: number): Promise<{ message: string; booking: Booking }> {
  return updateBookingStatus(id, 'CONFIRMED')
}

/**
 * Reject a pending booking with a reason (Owner action)
 */
export async function rejectBooking(
  id: number,
  rejectionReason?: string
): Promise<{ message: string; booking: Booking }> {
  return updateBookingStatus(id, 'REJECTED', rejectionReason)
}

/**
 * Cancel a pending booking (Farmer action)
 */
export async function cancelBooking(id: number): Promise<{ message: string; booking: Booking }> {
  return updateBookingStatus(id, 'CANCELLED')
}

/**
 * Activate a confirmed booking (Handover started)
 */
export async function activateBooking(id: number): Promise<{ message: string; booking: Booking }> {
  return updateBookingStatus(id, 'ACTIVE')
}

/**
 * Complete an active booking (Equipment returned)
 */
export async function completeBooking(id: number): Promise<{ message: string; booking: Booking }> {
  return updateBookingStatus(id, 'COMPLETED')
}

/**
 * Submit a review for a completed rental.
 * POST /api/reviews
 */
export async function createReview(data: CreateReviewData): Promise<CreateReviewResponse> {
  return apiRequest<CreateReviewResponse>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Fetch all reviews for a specific equipment item.
 * GET /api/equipment/:id/reviews
 */
export async function getEquipmentReviews(equipmentId: string | number): Promise<Review[]> {
  return apiRequest<Review[]>(`/equipment/${equipmentId}/reviews`)
}

export const reviewApi = {
  create: createReview,
  getByEquipment: getEquipmentReviews,
}

export const bookingApi = {
  create: createBooking,
  getMy: getMyBookings,
  getOwner: getOwnerBookings,
  updateStatus: updateBookingStatus,
  confirm: confirmBooking,
  reject: rejectBooking,
  cancel: cancelBooking,
  activate: activateBooking,
  complete: completeBooking,
}

export const equipmentApi = {
  getAll: getEquipmentList,
  getById: getEquipmentById,
  getReviews: getEquipmentReviews,
  create: createEquipment,
  update: updateEquipment,
  delete: deleteEquipment,
}

export default {
  ...equipmentApi,
  ...authApi,
  ...bookingApi,
  ...reviewApi,
}

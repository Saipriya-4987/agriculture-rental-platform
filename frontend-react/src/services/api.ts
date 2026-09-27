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

export const equipmentApi = {
  getAll: getEquipmentList,
  getById: getEquipmentById,
  create: createEquipment,
  update: updateEquipment,
  delete: deleteEquipment,
}

export default equipmentApi

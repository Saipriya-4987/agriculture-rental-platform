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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Fetch all equipment from the backend API.
 */
export async function getEquipmentList(): Promise<Equipment[]> {
  const response = await fetch(`${API_BASE_URL}/equipment`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `Failed to fetch equipment listings (status: ${response.status})`)
  }
  return response.json()
}

/**
 * Fetch a single equipment item by its ID.
 */
export async function getEquipmentById(id: string | number): Promise<Equipment> {
  const response = await fetch(`${API_BASE_URL}/equipment/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `Failed to fetch equipment details (status: ${response.status})`)
  }
  return response.json()
}

/**
 * Create a new equipment listing.
 */
export async function createEquipment(data: CreateEquipmentData): Promise<Equipment> {
  const response = await fetch(`${API_BASE_URL}/equipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || `Failed to create equipment listing (status: ${response.status})`)
  }
  return response.json()
}

export const equipmentApi = {
  getAll: getEquipmentList,
  getById: getEquipmentById,
  create: createEquipment,
}

export default equipmentApi

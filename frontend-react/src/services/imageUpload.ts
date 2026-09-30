/**
 * Cloudinary unsigned image upload service for AgriRent.
 * Uses client-side unsigned upload preset to keep API secrets secure.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

/**
 * Checks whether the Cloudinary environment variables are configured.
 */
export function isImageUploadConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET && CLOUD_NAME.trim() !== '' && UPLOAD_PRESET.trim() !== '')
}

/**
 * Validates an image file before upload.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type || !file.type.startsWith('image/')) {
    return 'Please select a valid image file (JPEG, PNG, WebP, etc.).'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image file size must be less than 10MB.'
  }

  return null
}

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * Returns the hosted HTTPS image URL.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!isImageUploadConfigured()) {
    throw new Error(
      'Image upload is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    )
  }

  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET.trim())

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME.trim()}/image/upload`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
  } catch (networkError) {
    throw new Error(
      networkError instanceof Error
        ? `Network error uploading image: ${networkError.message}`
        : 'Network error uploading image. Please check your internet connection.'
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data || data.error) {
    const errorMsg = data?.error?.message || `Upload failed with HTTP status ${response.status}`
    throw new Error(`Cloudinary upload failed: ${errorMsg}`)
  }

  const resultUrl = data.secure_url || data.url
  if (!resultUrl) {
    throw new Error('Upload succeeded but no image URL was returned.')
  }

  return resultUrl
}

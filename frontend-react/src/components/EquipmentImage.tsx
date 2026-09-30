import { useState } from 'react'

interface EquipmentImageProps {
  src?: string | null
  alt: string
  className?: string
}

// Fallback placeholder when image URL fails to load or is not provided
const DEFAULT_FALLBACK_IMAGE = 'https://placehold.co/600x400?text=AgriRent+Equipment'

export default function EquipmentImage({ src, alt, className = '' }: EquipmentImageProps) {
  const [hasError, setHasError] = useState(false)

  const imageSrc = !hasError && src && src.trim() !== '' ? src : DEFAULT_FALLBACK_IMAGE

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}

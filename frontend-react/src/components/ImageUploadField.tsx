import { useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { validateImageFile } from '../services/imageUpload'

interface ImageUploadFieldProps {
  id?: string
  label?: string
  file: File | null
  onChange: (file: File | null, error?: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  currentImageUrl?: string
  currentImageAlt?: string
}

export default function ImageUploadField({
  id = 'equipment-image',
  label = 'Equipment Image',
  file,
  onChange,
  error,
  required = false,
  disabled = false,
  currentImageUrl,
  currentImageAlt = 'Current equipment image',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null

    if (!selectedFile) {
      if (required && !currentImageUrl) {
        onChange(null, 'Please select an equipment image.')
      } else {
        onChange(null, undefined)
      }
      return
    }

    const validationError = validateImageFile(selectedFile)
    if (validationError) {
      if (inputRef.current) inputRef.current.value = ''
      onChange(null, validationError)
      return
    }

    onChange(selectedFile, undefined)
  }

  function handleRemove() {
    if (inputRef.current) inputRef.current.value = ''
    onChange(null, required && !currentImageUrl ? 'Please select an equipment image.' : undefined)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mb-5">
      <label htmlFor={id} className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        id={id}
        name="equipment_image"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* New file preview */}
      {previewUrl && file ? (
        <div className="border border-[#e5e7eb] rounded-[6px] p-3 bg-[#f9fafb]">
          <div className="flex items-start gap-4">
            <img
              src={previewUrl}
              alt="Selected equipment preview"
              className="w-24 h-24 object-cover rounded-[6px] border border-[#d1d5db] flex-shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#166534] mb-1">
                Ready to upload
              </span>
              <p className="text-sm font-medium text-[#1f2937] truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280]">{formatFileSize(file.size)}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  className="text-xs font-semibold text-[#166534] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Change file
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : currentImageUrl ? (
        /* Current image display when editing */
        <div className="border border-[#e5e7eb] rounded-[6px] p-3 bg-[#f9fafb]">
          <p className="text-xs font-semibold text-[#6b7280] mb-2">Current Image:</p>
          <div className="flex items-start gap-4">
            <img
              src={currentImageUrl}
              alt={currentImageAlt}
              className="w-24 h-24 object-cover rounded-[6px] border border-[#d1d5db] flex-shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6b7280] mb-2">
                This image is currently active for your listing. Choose a new file to replace it.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="px-3 py-1.5 bg-white border border-[#d1d5db] rounded-[6px] text-xs font-semibold text-[#1f2937] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                📷 Replace Image
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty upload dropzone / trigger */
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-[6px] p-6 text-center transition-colors cursor-pointer ${
            error
              ? 'border-red-300 bg-red-50/30'
              : 'border-[#d1d5db] hover:border-[#166534] bg-white hover:bg-[#ecfdf5]/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm font-semibold text-[#1f2937] mb-1">
            Click to upload equipment image
          </p>
          <p className="text-xs text-[#6b7280]">
            PNG, JPG, WebP up to 10MB
          </p>
        </div>
      )}

      {error && (
        <span className="text-red-600 text-xs block mt-1.5" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

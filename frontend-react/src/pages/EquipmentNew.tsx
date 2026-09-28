import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { locationData } from '../data/equipmentData.js'
import { createEquipment } from '../services/api'

interface FormData {
  name: string
  category: string
  state: string
  district: string
  village: string
  price: string
  dateFrom: string
  dateTo: string
}

interface FormErrors {
  name?: string
  category?: string
  state?: string
  district?: string
  village?: string
  price?: string
  dateFrom?: string
  dateTo?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

interface DistrictOption {
  value: string
  label: string
}

interface VillageOption {
  value: string
  label: string
}

const CATEGORY_LABELS: Record<string, string> = {
  tractor: 'Tractor',
  harvester: 'Harvester',
  tiller: 'Tiller',
  seeder: 'Seeder',
  sprayer: 'Sprayer',
  other: 'Other',
}

const STATE_LABELS: Record<string, string> = {
  'andhra-pradesh': 'Andhra Pradesh',
  telangana: 'Telangana',
  karnataka: 'Karnataka',
  'tamil-nadu': 'Tamil Nadu',
  maharashtra: 'Maharashtra',
  punjab: 'Punjab',
  gujarat: 'Gujarat',
  'madhya-pradesh': 'Madhya Pradesh',
  'uttar-pradesh': 'Uttar Pradesh',
  rajasthan: 'Rajasthan',
}

// M9 Step 1 + Step 3: Owner "List Equipment" page connected to backend API.
// Based on the <section class="auth-section"> markup in frontend/equipment-new.html.
function EquipmentNew() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    state: '',
    district: '',
    village: '',
    price: '',
    dateFrom: '',
    dateTo: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Generic change handler for plain fields
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  // Changing State clears District and Village
  function handleStateChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    setFormData((previous) => ({ ...previous, state: value, district: '', village: '' }))
  }

  // Changing District clears Village
  function handleDistrictChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    setFormData((previous) => ({ ...previous, district: value, village: '' }))
  }

  const locationDataTyped = locationData as Record<string, Record<string, { label: string; villages: VillageOption[] }>>
  const districtOptions: DistrictOption[] = formData.state && locationDataTyped[formData.state]
    ? Object.entries(locationDataTyped[formData.state]).map(([value, data]) => ({
        value,
        label: data.label,
      }))
    : []

  const stateData = formData.state ? locationDataTyped[formData.state] : undefined
  const districtData = stateData && formData.district ? stateData[formData.district] : undefined
  const villageOptions: VillageOption[] = districtData ? districtData.villages : []

  function validateListingForm(): FormErrors {
    const newErrors: FormErrors = {}

    if (formData.name.trim() === '') {
      newErrors.name = 'Please enter the equipment name.'
    }

    if (formData.category === '') {
      newErrors.category = 'Please select a category.'
    }

    if (formData.state === '') {
      newErrors.state = 'Please select a state.'
    }

    if (formData.district === '') {
      newErrors.district = 'Please select a district.'
    }

    if (formData.village === '') {
      newErrors.village = 'Please select a village/city.'
    }

    const rawPrice = formData.price.trim()
    if (rawPrice === '') {
      newErrors.price = 'Please enter the price per day.'
    } else {
      const price = Number(rawPrice)
      if (Number.isNaN(price) || price <= 0) {
        newErrors.price = 'Please enter a valid price greater than 0.'
      }
    }

    if (formData.dateFrom === '') {
      newErrors.dateFrom = 'Please choose an available-from date.'
    }

    if (formData.dateTo === '') {
      newErrors.dateTo = 'Please choose an available-until date.'
    }

    if (formData.dateFrom !== '' && formData.dateTo !== '' && formData.dateTo < formData.dateFrom) {
      newErrors.dateTo = 'Available Until date cannot be earlier than Available From date.'
    }

    return newErrors
  }

  async function handleListingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors = validateListingForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true)
      setMessage(null)

      try {
        const stateLabel = STATE_LABELS[formData.state] || formData.state
        const districtLabel = districtData?.label || formData.district
        const villageOption = villageOptions.find((v) => v.value === formData.village)
        const villageLabel = villageOption?.label || formData.village

        const created = await createEquipment({
          name: formData.name.trim(),
          category: CATEGORY_LABELS[formData.category] || formData.category,
          categoryValue: formData.category,
          state: stateLabel,
          stateValue: formData.state,
          district: districtLabel,
          districtValue: formData.district,
          village: villageLabel,
          villageValue: formData.village,
          city: villageLabel || districtLabel,
          pricePerDay: Number(formData.price),
          availabilityFrom: formData.dateFrom,
          availabilityTo: formData.dateTo,
          image: `https://placehold.co/400x300?text=${encodeURIComponent(formData.name.trim())}`,
          imageAlt: formData.name.trim(),
          description: `${CATEGORY_LABELS[formData.category] || formData.category} available for rent in ${villageLabel}, ${stateLabel}.`,
          owner: 'Farm Owner',
        })

        setCreatedId(created.id)
        setMessage({ text: 'Equipment listing submitted successfully.', type: 'success' })
        setFormData({
          name: '',
          category: '',
          state: '',
          district: '',
          village: '',
          price: '',
          dateFrom: '',
          dateTo: '',
        })
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : 'Failed to submit equipment listing. Please try again.',
          type: 'error',
        })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <section className="py-12 flex justify-center bg-[#f9fafb]">
      <div className="w-full max-w-[600px] px-5">
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-8 sm:p-10">
          <h1 className="text-[1.5rem] font-bold text-[#1f2937] mb-1.5">List your equipment</h1>
          <p className="text-[#6b7280] mb-6 text-[0.95rem]">Add your equipment so Farmers nearby can find and rent it.</p>

          {message && (
            <div
              className={`p-4 rounded-[6px] mb-4 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-[#166534] border border-[#d1fae5]'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
              aria-live="polite"
            >
              <p>{message.text}</p>
              {createdId && message.type === 'success' && (
                <div className="mt-2 pt-2 border-t border-[#d1fae5]">
                  <Link to={`/equipment/${createdId}`} className="font-bold underline hover:text-[#14532d]">
                    View new listing &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form className="flex flex-col" onSubmit={handleListingSubmit}>
            <div className="mb-4">
              <label htmlFor="listing-name" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Equipment Name
              </label>
              <input
                type="text"
                id="listing-name"
                name="name"
                placeholder="e.g. Mahindra 575 DI"
                value={formData.name}
                onChange={handleChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.name && <span className="text-red-600 text-xs block mt-1">{errors.name}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-category" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Category
              </label>
              <select
                id="listing-category"
                name="category"
                aria-label="Category"
                value={formData.category}
                onChange={handleChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full bg-white focus:outline-none focus:border-[#166534]"
              >
                <option value="">Select category</option>
                <option value="tractor">Tractor</option>
                <option value="harvester">Harvester</option>
                <option value="tiller">Tiller</option>
                <option value="seeder">Seeder</option>
                <option value="sprayer">Sprayer</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <span className="text-red-600 text-xs block mt-1">{errors.category}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-state" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                State
              </label>
              <select
                id="listing-state"
                name="state"
                aria-label="State"
                value={formData.state}
                onChange={handleStateChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full bg-white focus:outline-none focus:border-[#166534]"
              >
                <option value="">Select your state</option>
                <option value="andhra-pradesh">Andhra Pradesh</option>
                <option value="telangana">Telangana</option>
                <option value="karnataka">Karnataka</option>
                <option value="tamil-nadu">Tamil Nadu</option>
                <option value="maharashtra">Maharashtra</option>
                <option value="punjab">Punjab</option>
                <option value="gujarat">Gujarat</option>
                <option value="madhya-pradesh">Madhya Pradesh</option>
                <option value="uttar-pradesh">Uttar Pradesh</option>
                <option value="rajasthan">Rajasthan</option>
              </select>
              {errors.state && <span className="text-red-600 text-xs block mt-1">{errors.state}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-district" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                District
              </label>
              <select
                id="listing-district"
                name="district"
                aria-label="District"
                value={formData.district}
                onChange={handleDistrictChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full bg-white focus:outline-none focus:border-[#166534]"
              >
                <option value="">Select district</option>
                {districtOptions.map((district) => (
                  <option key={district.value} value={district.value}>
                    {district.label}
                  </option>
                ))}
              </select>
              {errors.district && <span className="text-red-600 text-xs block mt-1">{errors.district}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-village" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Village/City
              </label>
              <select
                id="listing-village"
                name="village"
                aria-label="Village or city"
                value={formData.village}
                onChange={handleChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full bg-white focus:outline-none focus:border-[#166534]"
              >
                <option value="">Select village/city</option>
                {villageOptions.map((village) => (
                  <option key={village.value} value={village.value}>
                    {village.label}
                  </option>
                ))}
              </select>
              {errors.village && <span className="text-red-600 text-xs block mt-1">{errors.village}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-price" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Price per Day (&#8377;)
              </label>
              <input
                type="number"
                id="listing-price"
                name="price"
                placeholder="e.g. 1200"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.price && <span className="text-red-600 text-xs block mt-1">{errors.price}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="listing-date-from" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                  Available From
                </label>
                <input
                  type="date"
                  id="listing-date-from"
                  name="dateFrom"
                  aria-label="Available from"
                  value={formData.dateFrom}
                  onChange={handleChange}
                  className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
                />
                {errors.dateFrom && <span className="text-red-600 text-xs block mt-1">{errors.dateFrom}</span>}
              </div>

              <div>
                <label htmlFor="listing-date-until" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                  Available Until
                </label>
                <input
                  type="date"
                  id="listing-date-until"
                  name="dateTo"
                  aria-label="Available until"
                  value={formData.dateTo}
                  onChange={handleChange}
                  className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
                />
                {errors.dateTo && <span className="text-red-600 text-xs block mt-1">{errors.dateTo}</span>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-auth"
            >
              {isSubmitting ? 'Listing Equipment...' : 'List Equipment'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default EquipmentNew

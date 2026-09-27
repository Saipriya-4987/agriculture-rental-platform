import { useState, FormEvent, ChangeEvent } from 'react'
import { locationData } from '../data/equipmentData.js'

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

// M3 step 8: Owner "List Equipment" page component.
// Based on the <section class="auth-section"> markup in
// frontend/equipment-new.html, with the validation behaviour of
// frontend/js/main.js's listingForm block (validateListingForm/
// handleListingSubmit) re-implemented in React (not imported - main.js is
// never used here). Frontend-only: this never saves a listing anywhere,
// same as the original page.
//
// The State -> District -> Village cascade reuses the same locationData
// import and reset-on-change pattern already used by Home.jsx's search
// filters, instead of main.js's shared stateSelect/districtSelect
// querySelector wiring.
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

  // Generic change handler for the plain fields (name, category, price,
  // the two dates, and village once a district is chosen).
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  // Same cascade reset behaviour as Home.jsx: changing State clears the
  // (now possibly invalid) District and Village; changing District clears
  // Village.
  function handleStateChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    setFormData((previous) => ({ ...previous, state: value, district: '', village: '' }))
  }

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

  // Same rules, order, and messages as main.js's validateListingForm(),
  // just returning an errors object instead of inserting
  // <span class="field-error"> elements.
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

    // Price must be present AND a valid positive number - an empty
    // string, "abc", "0" and "-50" are all rejected here, each with its
    // own message.
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

    // Same "YYYY-MM-DD" plain-string comparison used elsewhere (Home
    // page's date filters, the Equipment Details rental form) - only
    // checked once both dates are present, so this doesn't pile a second
    // error onto an already-empty field.
    if (formData.dateFrom !== '' && formData.dateTo !== '' && formData.dateTo < formData.dateFrom) {
      newErrors.dateTo = 'Available Until date cannot be earlier than Available From date.'
    }

    return newErrors
  }

  function handleListingSubmit(event: FormEvent<HTMLFormElement>) {
    // This is a frontend-only demo - never actually saves a listing.
    event.preventDefault()

    const newErrors = validateListingForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage({ text: 'Equipment listing submitted successfully.', type: 'success' })
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <section className="py-15 flex justify-center">
      <div className="w-full max-w-[420px] px-5">
        <div className="bg-white border border-gray-200 rounded-xl p-10">
          <h1 className="text-[1.5rem] mb-1.5">List your equipment</h1>
          <p className="text-gray-500 mb-6 text-[0.95rem]">Add your equipment so Farmers nearby can find and rent it.</p>

          {message && (
            <p className={`p-3 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="flex flex-col" onSubmit={handleListingSubmit}>
            <div className="mb-4">
              <label htmlFor="listing-name" className="text-sm font-semibold mb-1.5">Equipment Name</label>
              <input
                type="text"
                id="listing-name"
                name="name"
                placeholder="e.g. Mahindra 575 DI"
                value={formData.name}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.name && <span className="text-red-600 text-sm block mt-1">{errors.name}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-category" className="text-sm font-semibold mb-1.5">Category</label>
              <select
                id="listing-category"
                name="category"
                aria-label="Category"
                value={formData.category}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              >
                <option value="">Select category</option>
                <option value="tractor">Tractor</option>
                <option value="harvester">Harvester</option>
                <option value="tiller">Tiller</option>
                <option value="seeder">Seeder</option>
                <option value="sprayer">Sprayer</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <span className="text-red-600 text-sm block mt-1">{errors.category}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-state" className="text-sm font-semibold mb-1.5">State</label>
              <select
                id="listing-state"
                name="state"
                aria-label="State"
                value={formData.state}
                onChange={handleStateChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
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
              {errors.state && <span className="text-red-600 text-sm block mt-1">{errors.state}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-district" className="text-sm font-semibold mb-1.5">District</label>
              <select
                id="listing-district"
                name="district"
                aria-label="District"
                value={formData.district}
                onChange={handleDistrictChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              >
                <option value="">Select district</option>
                {districtOptions.map((district) => (
                  <option key={district.value} value={district.value}>
                    {district.label}
                  </option>
                ))}
              </select>
              {errors.district && <span className="text-red-600 text-sm block mt-1">{errors.district}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-village" className="text-sm font-semibold mb-1.5">Village/City</label>
              <select
                id="listing-village"
                name="village"
                aria-label="Village or city"
                value={formData.village}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              >
                <option value="">Select village/city</option>
                {villageOptions.map((village) => (
                  <option key={village.value} value={village.value}>
                    {village.label}
                  </option>
                ))}
              </select>
              {errors.village && <span className="text-red-600 text-sm block mt-1">{errors.village}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-price" className="text-sm font-semibold mb-1.5">Price per Day (&#8377;)</label>
              <input
                type="number"
                id="listing-price"
                name="price"
                placeholder="e.g. 1200"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.price && <span className="text-red-600 text-sm block mt-1">{errors.price}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-date-from" className="text-sm font-semibold mb-1.5">Available From</label>
              <input
                type="date"
                id="listing-date-from"
                name="dateFrom"
                aria-label="Available from"
                value={formData.dateFrom}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.dateFrom && <span className="text-red-600 text-sm block mt-1">{errors.dateFrom}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="listing-date-until" className="text-sm font-semibold mb-1.5">Available Until</label>
              <input
                type="date"
                id="listing-date-until"
                name="dateTo"
                aria-label="Available until"
                value={formData.dateTo}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.dateTo && <span className="text-red-600 text-sm block mt-1">{errors.dateTo}</span>}
            </div>

            <button type="submit" className="px-4 py-3 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900">List Equipment</button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default EquipmentNew

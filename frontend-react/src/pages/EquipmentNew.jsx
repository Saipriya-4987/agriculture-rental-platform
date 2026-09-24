import { useState } from 'react'
import { locationData } from '../data/equipmentData.js'

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
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    state: '',
    district: '',
    village: '',
    price: '',
    dateFrom: '',
    dateTo: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)

  // Generic change handler for the plain fields (name, category, price,
  // the two dates, and village once a district is chosen).
  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  // Same cascade reset behaviour as Home.jsx: changing State clears the
  // (now possibly invalid) District and Village; changing District clears
  // Village.
  function handleStateChange(event) {
    const { value } = event.target
    setFormData((previous) => ({ ...previous, state: value, district: '', village: '' }))
  }

  function handleDistrictChange(event) {
    const { value } = event.target
    setFormData((previous) => ({ ...previous, district: value, village: '' }))
  }

  const districtOptions = formData.state && locationData[formData.state]
    ? Object.entries(locationData[formData.state]).map(([value, data]) => ({
        value,
        label: data.label,
      }))
    : []

  const stateData = locationData[formData.state]
  const districtData = stateData ? stateData[formData.district] : undefined
  const villageOptions = districtData ? districtData.villages : []

  // Same rules, order, and messages as main.js's validateListingForm(),
  // just returning an errors object instead of inserting
  // <span class="field-error"> elements.
  function validateListingForm() {
    const newErrors = {}

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

  function handleListingSubmit(event) {
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
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>List your equipment</h1>
          <p className="auth-subtext">Add your equipment so Farmers nearby can find and rent it.</p>

          {message && (
            <p className={`form-message ${message.type}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="auth-form" onSubmit={handleListingSubmit}>
            <label htmlFor="listing-name">Equipment Name</label>
            <input
              type="text"
              id="listing-name"
              name="name"
              placeholder="e.g. Mahindra 575 DI"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}

            <label htmlFor="listing-category">Category</label>
            <select
              id="listing-category"
              name="category"
              aria-label="Category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              <option value="tractor">Tractor</option>
              <option value="harvester">Harvester</option>
              <option value="tiller">Tiller</option>
              <option value="seeder">Seeder</option>
              <option value="sprayer">Sprayer</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}

            <label htmlFor="listing-state">State</label>
            <select
              id="listing-state"
              name="state"
              aria-label="State"
              value={formData.state}
              onChange={handleStateChange}
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
            {errors.state && <span className="field-error">{errors.state}</span>}

            <label htmlFor="listing-district">District</label>
            <select
              id="listing-district"
              name="district"
              aria-label="District"
              value={formData.district}
              onChange={handleDistrictChange}
            >
              <option value="">Select district</option>
              {districtOptions.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
            {errors.district && <span className="field-error">{errors.district}</span>}

            <label htmlFor="listing-village">Village/City</label>
            <select
              id="listing-village"
              name="village"
              aria-label="Village or city"
              value={formData.village}
              onChange={handleChange}
            >
              <option value="">Select village/city</option>
              {villageOptions.map((village) => (
                <option key={village.value} value={village.value}>
                  {village.label}
                </option>
              ))}
            </select>
            {errors.village && <span className="field-error">{errors.village}</span>}

            <label htmlFor="listing-price">Price per Day (&#8377;)</label>
            <input
              type="number"
              id="listing-price"
              name="price"
              placeholder="e.g. 1200"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
            />
            {errors.price && <span className="field-error">{errors.price}</span>}

            <label htmlFor="listing-date-from">Available From</label>
            <input
              type="date"
              id="listing-date-from"
              name="dateFrom"
              aria-label="Available from"
              value={formData.dateFrom}
              onChange={handleChange}
            />
            {errors.dateFrom && <span className="field-error">{errors.dateFrom}</span>}

            <label htmlFor="listing-date-until">Available Until</label>
            <input
              type="date"
              id="listing-date-until"
              name="dateTo"
              aria-label="Available until"
              value={formData.dateTo}
              onChange={handleChange}
            />
            {errors.dateTo && <span className="field-error">{errors.dateTo}</span>}

            <button type="submit" className="btn-auth">List Equipment</button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default EquipmentNew
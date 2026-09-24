import { useState } from 'react'
import EquipmentCard from '../components/EquipmentCard.jsx'
import equipmentData, { locationData } from '../data/equipmentData.js'

// M3 step 3 + step 4: Home page component.
// Based on the <section class="hero"> + <section class="equipment-section">
// markup in frontend/index.html, with the filtering behaviour of
// frontend/js/main.js's filterEquipmentByKeyword/populateDistrictOptions/
// populateVillageOptions re-implemented in React (not imported - main.js
// is never used here).
//
// All filter fields are CONTROLLED (useState) and filtering is LIVE: the
// equipment grid is derived from `filters` on every render via
// getFilteredEquipment(), so results update as soon as a field changes -
// no separate "apply" step, and clearing a field naturally restores the
// equipment that field was narrowing.
function Home() {
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    state: '',
    district: '',
    village: '',
    priceMin: '',
    priceMax: '',
    dateFrom: '',
    dateTo: '',
  })

  // Generic change handler for most fields: reads the field's `name` and
  // updates just that key in filters state.
  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }))
  }

  // State -> District -> Village cascade: changing State clears the
  // (now possibly invalid) District and Village; changing District clears
  // Village. Same reset behaviour as main.js's stateSelect/districtSelect
  // 'change' listeners, just expressed as state updates.
  function handleStateChange(event) {
    const { value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      state: value,
      district: '',
      village: '',
    }))
  }

  function handleDistrictChange(event) {
    const { value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      district: value,
      village: '',
    }))
  }

  // Options for the District select, driven by the currently selected
  // State (empty/unknown state = no districts yet).
  const districtOptions = filters.state && locationData[filters.state]
    ? Object.entries(locationData[filters.state]).map(([value, data]) => ({
        value,
        label: data.label,
      }))
    : []

  // Options for the Village/City select, driven by the currently selected
  // State AND District.
  const stateData = locationData[filters.state]
  const districtData = stateData ? stateData[filters.district] : undefined
  const villageOptions = districtData ? districtData.villages : []

  // Placeholder submit handler: filtering already runs live via the
  // controlled fields above, so submitting the form just stops the page
  // from reloading (action="#" behaviour).
  function handleSearchSubmit(event) {
    event.preventDefault()
  }

  // Same filtering rules as frontend/js/main.js's filterEquipmentByKeyword:
  // keyword matches name OR category (case-insensitive); every other
  // filter is ignored when left empty/unselected, otherwise must match
  // exactly (category/state/district/village) or fall within range
  // (price, availability window).
  function getFilteredEquipment() {
    const lowerKeyword = filters.keyword.trim().toLowerCase()

    const rawMin = filters.priceMin.trim()
    const rawMax = filters.priceMax.trim()
    const minPrice = rawMin === '' ? null : Number(rawMin)
    const maxPrice = rawMax === '' ? null : Number(rawMax)

    return equipmentData.filter((item) => {
      const nameMatches = item.name.toLowerCase().includes(lowerKeyword)
      const categoryTextMatches = item.category.toLowerCase().includes(lowerKeyword)
      const keywordMatches = lowerKeyword === '' || nameMatches || categoryTextMatches

      const categoryMatches = filters.category === '' || item.categoryValue === filters.category
      const stateMatches = filters.state === '' || item.stateValue === filters.state
      const districtMatches = filters.district === '' || item.districtValue === filters.district
      const villageMatches = filters.village === '' || item.villageValue === filters.village

      const minPriceMatches = minPrice === null || item.pricePerDay >= minPrice
      const maxPriceMatches = maxPrice === null || item.pricePerDay <= maxPrice

      // Equipment must already be available on/before the requested start
      // date, and remain available on/after the requested end date - i.e.
      // its availability window covers the requested range. Dates are
      // plain "YYYY-MM-DD" strings, so string comparison is enough.
      const fromMatches = filters.dateFrom === '' || item.availabilityFrom <= filters.dateFrom
      const toMatches = filters.dateTo === '' || item.availabilityTo >= filters.dateTo

      return keywordMatches
        && categoryMatches
        && stateMatches
        && districtMatches
        && villageMatches
        && minPriceMatches
        && maxPriceMatches
        && fromMatches
        && toMatches
    })
  }

  const filteredEquipment = getFilteredEquipment()

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Rent farm equipment from owners near you</h1>
          <p className="hero-subtext">
            Tractors, harvesters, tillers and more &mdash; find what you need,
            check availability, and book in a few steps.
          </p>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              name="keyword"
              placeholder="Search equipment, e.g. 'tractor'"
              aria-label="Search equipment"
              value={filters.keyword}
              onChange={handleFilterChange}
            />

            <select
              name="category"
              aria-label="Filter by category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="tractor">Tractor</option>
              <option value="harvester">Harvester</option>
              <option value="tiller">Tiller</option>
              <option value="seeder">Seeder</option>
              <option value="sprayer">Sprayer</option>
              <option value="other">Other</option>
            </select>

            <select
              name="state"
              aria-label="Filter by state"
              value={filters.state}
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

            {/* District/Village options come from locationData and cascade
                off State/District, same demo hierarchy as main.js's
                LOCATION_DATA (only Andhra Pradesh and Telangana have
                districts defined - other states show no options yet). */}
            <select
              name="district"
              aria-label="Filter by district"
              value={filters.district}
              onChange={handleDistrictChange}
            >
              <option value="">Select district</option>
              {districtOptions.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>

            <select
              name="village"
              aria-label="Filter by village or city"
              value={filters.village}
              onChange={handleFilterChange}
            >
              <option value="">Select village/city</option>
              {villageOptions.map((village) => (
                <option key={village.value} value={village.value}>
                  {village.label}
                </option>
              ))}
            </select>

            <button type="submit">Search</button>

            <div className="filters-row">
              <div className="filter-group">
                <label htmlFor="price-min">Price Range (&#8377;/day)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    id="price-min"
                    name="priceMin"
                    placeholder="Min"
                    min="0"
                    value={filters.priceMin}
                    onChange={handleFilterChange}
                  />
                  <span>&ndash;</span>
                  <input
                    type="number"
                    id="price-max"
                    name="priceMax"
                    placeholder="Max"
                    min="0"
                    value={filters.priceMax}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="date-from">Available From</label>
                <input
                  type="date"
                  id="date-from"
                  name="dateFrom"
                  aria-label="Available from"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="date-to">Available Until</label>
                <input
                  type="date"
                  id="date-to"
                  name="dateTo"
                  aria-label="Available until"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="equipment-section">
        <div className="container">
          <h2>Available Equipment</h2>

          <div className="equipment-grid">
            {filteredEquipment.length === 0 ? (
              <p className="no-results">No equipment found</p>
            ) : (
              filteredEquipment.map((equipment) => (
                <EquipmentCard key={equipment.id} equipment={equipment} />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
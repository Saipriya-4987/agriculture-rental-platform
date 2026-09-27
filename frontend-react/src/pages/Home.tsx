import { useState } from 'react'
import type { ChangeEvent, ComponentProps, FormEvent } from 'react'
import EquipmentCard from '../components/EquipmentCard'
import equipmentData, { locationData } from '../data/equipmentData.js'

// Reuse the card's own equipment type (the fields <EquipmentCard> reads)
// and add the filter-only fields that exist on every item in
// equipmentData.js, instead of re-declaring the card fields here.
type CardEquipment = ComponentProps<typeof EquipmentCard>['equipment']

interface HomeEquipment extends CardEquipment {
  categoryValue: string
  stateValue: string
  districtValue: string
  villageValue: string
  availabilityFrom: string
  availabilityTo: string
}

// Shape of the State -> District -> Village hierarchy in locationData.
interface VillageOption {
  value: string
  label: string
}

interface DistrictData {
  label: string
  villages: VillageOption[]
}

type LocationData = Record<string, Record<string, DistrictData>>

// equipmentData.js is plain JS, so its keys are inferred as fixed literals;
// this lets Home look districts up by whichever state string is selected.
const locations: LocationData = locationData

interface Filters {
  keyword: string
  category: string
  state: string
  district: string
  village: string
  priceMin: string
  priceMax: string
  dateFrom: string
  dateTo: string
}

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
  const [filters, setFilters] = useState<Filters>({
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
  function handleFilterChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
  function handleStateChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      state: value,
      district: '',
      village: '',
    }))
  }

  function handleDistrictChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      district: value,
      village: '',
    }))
  }

  // Options for the District select, driven by the currently selected
  // State (empty/unknown state = no districts yet).
  const districtOptions = filters.state && locations[filters.state]
    ? Object.entries(locations[filters.state]).map(([value, data]) => ({
        value,
        label: data.label,
      }))
    : []

  // Options for the Village/City select, driven by the currently selected
  // State AND District.
  const stateData = locations[filters.state]
  const districtData = stateData ? stateData[filters.district] : undefined
  const villageOptions = districtData ? districtData.villages : []

  // Placeholder submit handler: filtering already runs live via the
  // controlled fields above, so submitting the form just stops the page
  // from reloading (action="#" behaviour).
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  // Same filtering rules as frontend/js/main.js's filterEquipmentByKeyword:
  // keyword matches name OR category (case-insensitive); every other
  // filter is ignored when left empty/unselected, otherwise must match
  // exactly (category/state/district/village) or fall within range
  // (price, availability window).
  function getFilteredEquipment(): HomeEquipment[] {
    const lowerKeyword = filters.keyword.trim().toLowerCase()

    const rawMin = filters.priceMin.trim()
    const rawMax = filters.priceMax.trim()
    const minPrice = rawMin === '' ? null : Number(rawMin)
    const maxPrice = rawMax === '' ? null : Number(rawMax)

    return equipmentData.filter((item: HomeEquipment) => {
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
      <section className="bg-green-800 text-white text-center py-[60px]">
        <div className="max-w-[1100px] mx-auto px-5">
          <h1 className="text-[2.2rem] mb-3">Rent farm equipment from owners near you</h1>
          <p className="text-[1.1rem] text-green-100 max-w-[600px] mx-auto mb-8">
            Tractors, harvesters, tillers and more &mdash; find what you need,
            check availability, and book in a few steps.
          </p>

          <form className="flex flex-wrap justify-center gap-3 max-w-[820px] mx-auto" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              name="keyword"
              placeholder="Search equipment, e.g. 'tractor'"
              aria-label="Search equipment"
              value={filters.keyword}
              onChange={handleFilterChange}
              className="flex-1 min-w-[220px] px-[14px] py-3 border-none rounded-md text-base"
            />

            <select
              name="category"
              aria-label="Filter by category"
              value={filters.category}
              onChange={handleFilterChange}
              className="flex-0 min-w-[160px] px-[14px] py-3 border-none rounded-md text-base"
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
              className="flex-0 min-w-[160px] px-[14px] py-3 border-none rounded-md text-base"
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
              className="flex-0 min-w-[160px] px-[14px] py-3 border-none rounded-md text-base"
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
              className="flex-0 min-w-[160px] px-[14px] py-3 border-none rounded-md text-base"
            >
              <option value="">Select village/city</option>
              {villageOptions.map((village) => (
                <option key={village.value} value={village.value}>
                  {village.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="flex-0 px-6 py-3 border-none rounded-md bg-amber-500 text-white font-bold text-base cursor-pointer hover:bg-amber-600"
            >
              Search
            </button>

            <div className="w-full flex flex-wrap justify-center gap-7 mt-[18px]">
              <div className="flex flex-col items-start">
                <label htmlFor="price-min" className="text-xs font-semibold text-green-100 mb-1.5">Price Range (&#8377;/day)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="price-min"
                    name="priceMin"
                    placeholder="Min"
                    min="0"
                    value={filters.priceMin}
                    onChange={handleFilterChange}
                    className="px-3 py-2.5 border-none rounded-md text-sm w-[120px]"
                  />
                  <span className="text-green-100">&ndash;</span>
                  <input
                    type="number"
                    id="price-max"
                    name="priceMax"
                    placeholder="Max"
                    min="0"
                    value={filters.priceMax}
                    onChange={handleFilterChange}
                    className="px-3 py-2.5 border-none rounded-md text-sm w-[120px]"
                  />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="date-from" className="text-xs font-semibold text-green-100 mb-1.5">Available From</label>
                <input
                  type="date"
                  id="date-from"
                  name="dateFrom"
                  aria-label="Available from"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border-none rounded-md"
                />
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="date-to" className="text-xs font-semibold text-green-100 mb-1.5">Available Until</label>
                <input
                  type="date"
                  id="date-to"
                  name="dateTo"
                  aria-label="Available until"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border-none rounded-md"
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1100px] mx-auto px-5">
          <h2 className="text-[1.6rem] mb-6">Available Equipment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-8">No equipment found</p>
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
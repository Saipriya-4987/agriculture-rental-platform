import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import EquipmentCard from '../components/EquipmentCard'
import { locationData } from '../data/equipmentData.js'
import { getEquipmentList, type Equipment } from '../services/api'

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

// M3 step 3 + M9 Step 4: Home page component connected to backend API.
function Home() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    let ignore = false

    getEquipmentList()
      .then((data) => {
        if (!ignore) {
          setEquipmentList(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load equipment.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  function handleRetry() {
    setLoading(true)
    setError(null)
    getEquipmentList()
      .then((data) => {
        setEquipmentList(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load equipment.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function handleFilterChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }))
  }

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

  const districtOptions = filters.state && locations[filters.state]
    ? Object.entries(locations[filters.state]).map(([value, data]) => ({
        value,
        label: data.label,
      }))
    : []

  const stateData = locations[filters.state]
  const districtData = stateData ? stateData[filters.district] : undefined
  const villageOptions = districtData ? districtData.villages : []

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  function getFilteredEquipment(): Equipment[] {
    const lowerKeyword = filters.keyword.trim().toLowerCase()

    const rawMin = filters.priceMin.trim()
    const rawMax = filters.priceMax.trim()
    const minPrice = rawMin === '' ? null : Number(rawMin)
    const maxPrice = rawMax === '' ? null : Number(rawMax)

    return equipmentList.filter((item: Equipment) => {
      const nameMatches = item.name.toLowerCase().includes(lowerKeyword)
      const categoryTextMatches = item.category.toLowerCase().includes(lowerKeyword)
      const keywordMatches = lowerKeyword === '' || nameMatches || categoryTextMatches

      const categoryMatches = filters.category === '' || (item.categoryValue || item.category.toLowerCase()) === filters.category
      const stateMatches = filters.state === '' || (item.stateValue || item.state.toLowerCase().replace(/\s+/g, '-')) === filters.state
      const districtMatches = filters.district === '' || (item.districtValue || (item.district ? item.district.toLowerCase() : '')) === filters.district
      const villageMatches = filters.village === '' || (item.villageValue || (item.village ? item.village.toLowerCase() : '')) === filters.village

      const minPriceMatches = minPrice === null || item.pricePerDay >= minPrice
      const maxPriceMatches = maxPrice === null || item.pricePerDay <= maxPrice

      const fromMatches = filters.dateFrom === '' || !item.availabilityFrom || item.availabilityFrom <= filters.dateFrom
      const toMatches = filters.dateTo === '' || !item.availabilityTo || item.availabilityTo >= filters.dateTo

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

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 text-base font-medium">Loading available equipment...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-lg text-center max-w-[600px] mx-auto mb-8">
              <p className="font-semibold text-lg mb-1">Unable to Load Equipment</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2 bg-green-800 text-white rounded-md text-sm font-semibold hover:bg-green-900 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-8">No equipment found</p>
              ) : (
                filteredEquipment.map((equipment) => (
                  <EquipmentCard key={equipment.id} equipment={equipment} />
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Home
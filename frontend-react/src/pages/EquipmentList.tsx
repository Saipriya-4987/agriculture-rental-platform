import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import EquipmentCard from '../components/EquipmentCard'
import { getEquipmentList, type Equipment } from '../services/api'

interface ListFilters {
  keyword: string
  category: string
  state: string
  priceMin: string
  priceMax: string
  dateFrom: string
  dateTo: string
}

function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ListFilters>({
    keyword: '',
    category: '',
    state: '',
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
          setEquipment(data)
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
        setEquipment(data)
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
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  const filteredEquipment = equipment.filter((item: Equipment) => {
    const lowerKeyword = filters.keyword.trim().toLowerCase()
    const nameMatches = item.name.toLowerCase().includes(lowerKeyword)
    const categoryTextMatches = item.category.toLowerCase().includes(lowerKeyword)
    const keywordMatches = lowerKeyword === '' || nameMatches || categoryTextMatches

    const categoryMatches = filters.category === ''
      || (item.categoryValue || item.category.toLowerCase()) === filters.category

    const stateMatches = filters.state === ''
      || (item.stateValue || item.state.toLowerCase().replace(/\s+/g, '-')) === filters.state

    const rawMin = filters.priceMin.trim()
    const rawMax = filters.priceMax.trim()
    const minPrice = rawMin === '' ? null : Number(rawMin)
    const maxPrice = rawMax === '' ? null : Number(rawMax)

    const minPriceMatches = minPrice === null || item.pricePerDay >= minPrice
    const maxPriceMatches = maxPrice === null || item.pricePerDay <= maxPrice

    const fromMatches = filters.dateFrom === '' || !item.availabilityFrom || item.availabilityFrom <= filters.dateFrom
    const toMatches = filters.dateTo === '' || !item.availabilityTo || item.availabilityTo >= filters.dateTo

    return keywordMatches && categoryMatches && stateMatches && minPriceMatches && maxPriceMatches && fromMatches && toMatches
  })

  return (
    <>
      <section className="bg-[#ecfdf5] border-b border-[#d1fae5] text-center py-10 pb-8">
        <div className="max-w-[1100px] mx-auto px-5">
          <h1 className="text-[1.8rem] font-bold text-[#14532d] mb-2">Browse Equipment</h1>
          <p className="text-[#374151] mb-6">All listed equipment. Use the filters below to narrow your search.</p>

          <form className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 max-w-[820px] mx-auto" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              name="keyword"
              placeholder="Search equipment, e.g. 'tractor'"
              aria-label="Search equipment"
              value={filters.keyword}
              onChange={handleFilterChange}
              className="flex-1 min-w-[220px] px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
            />

            <select
              name="category"
              aria-label="Filter by category"
              value={filters.category}
              onChange={handleFilterChange}
              className="flex-0 min-w-[160px] px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
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
              onChange={handleFilterChange}
              className="flex-0 min-w-[160px] px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
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

            <button
              type="submit"
              className="flex-0 px-6 py-3 border-none rounded-[6px] bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-base cursor-pointer transition-colors"
            >
              Search
            </button>

            <div className="w-full flex flex-wrap justify-center gap-7 mt-[18px]">
              <div className="flex flex-col items-start">
                <label htmlFor="list-price-min" className="text-xs font-semibold text-[#374151] mb-1.5">Price Range (&#8377;/day)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="list-price-min"
                    name="priceMin"
                    placeholder="Min"
                    min="0"
                    value={filters.priceMin}
                    onChange={handleFilterChange}
                    className="px-3 py-2.5 border border-[#d1d5db] rounded-[6px] text-sm text-[#1f2937] bg-white w-[120px] focus:outline-none focus:border-[#166534]"
                  />
                  <span className="text-[#374151]">&ndash;</span>
                  <input
                    type="number"
                    id="list-price-max"
                    name="priceMax"
                    placeholder="Max"
                    min="0"
                    value={filters.priceMax}
                    onChange={handleFilterChange}
                    className="px-3 py-2.5 border border-[#d1d5db] rounded-[6px] text-sm text-[#1f2937] bg-white w-[120px] focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="list-date-from" className="text-xs font-semibold text-[#374151] mb-1.5">Available From</label>
                <input
                  type="date"
                  id="list-date-from"
                  name="dateFrom"
                  aria-label="Available from"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border border-[#d1d5db] rounded-[6px] text-sm text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
                />
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="list-date-to" className="text-xs font-semibold text-[#374151] mb-1.5">Available Until</label>
                <input
                  type="date"
                  id="list-date-to"
                  name="dateTo"
                  aria-label="Available until"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border border-[#d1d5db] rounded-[6px] text-sm text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="py-12 bg-[#f9fafb]">
        <div className="max-w-[1100px] mx-auto px-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#166534] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#6b7280] text-base font-medium">Loading equipment listings...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-[10px] text-center max-w-[600px] mx-auto mb-8">
              <p className="font-semibold text-lg mb-1">Unable to Load Equipment</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2 bg-[#166534] text-white rounded-[6px] text-sm font-semibold hover:bg-[#14532d] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredEquipment.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white rounded-[10px] border border-[#e5e7eb] my-4">
                  <div className="text-4xl mb-3">🚜</div>
                  <h3 className="text-xl font-bold text-[#1f2937] mb-2">No Equipment Found</h3>
                  <p className="text-[#6b7280] max-w-md mx-auto mb-6 text-sm">
                    {equipment.length === 0
                      ? 'There are currently no equipment listings available. Be the first to list your agricultural machinery for rent!'
                      : 'No equipment matches your search filters. Try adjusting your search criteria.'}
                  </p>
                  <Link
                    to="/equipment/new"
                    className="inline-block px-5 py-2.5 bg-[#166534] text-white rounded-[6px] font-semibold hover:bg-[#14532d] transition-colors"
                  >
                    List Your Equipment
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-[1.6rem] font-bold text-[#1f2937] mb-6">{filteredEquipment.length} result{filteredEquipment.length === 1 ? '' : 's'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEquipment.map((item: Equipment) => (
                      <EquipmentCard key={item.id} equipment={item} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

export default EquipmentList
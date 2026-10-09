import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import EquipmentCard from '../components/EquipmentCard'
import EquipmentImage from '../components/EquipmentImage'
import { getMyEquipment, type Equipment } from '../services/api'

type AvailabilityStatus = 'within_window' | 'upcoming' | 'past' | 'unknown'

function getAvailabilityStatus(item: Equipment): AvailabilityStatus {
  const from = item.availabilityFrom?.trim()
  const to = item.availabilityTo?.trim()
  if (!from || !to) return 'unknown'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'unknown'

  if (today < start) return 'upcoming'
  if (today > end) return 'past'
  return 'within_window'
}

function AvailabilityStatusBadge({ status }: { status: AvailabilityStatus }) {
  switch (status) {
    case 'within_window':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Within availability window
        </span>
      )
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-blue-50 text-blue-800 border border-blue-200">
          Upcoming availability
        </span>
      )
    case 'past':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200">
          Outside availability window
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-100 text-gray-700 border border-gray-200">
          Availability dates not set
        </span>
      )
  }
}

function formatAvailabilityNote(item: Equipment): string | undefined {
  if (item.availabilityFrom && item.availabilityTo) {
    return `Available ${item.availabilityFrom} – ${item.availabilityTo}`
  }
  return undefined
}

export default function OwnerMyListings() {
  const [listings, setListings] = useState<Equipment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  function handleRefresh() {
    setLoading(true)
    setError(null)
    getMyEquipment()
      .then((data) => {
        setListings(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load your equipment listings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false

    getMyEquipment()
      .then((data) => {
        if (!ignore) {
          setListings(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load your equipment listings.')
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

  return (
    <section className="py-8 pb-16 min-h-[75vh] bg-[#f9fafb]">
      <div className="max-w-[1100px] mx-auto px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937] tracking-tight">My Equipment Listings</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Manage the machinery you have listed for rent on AgriRent.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh listings"
              className="p-2 text-gray-600 hover:text-[#166534] hover:bg-[#ecfdf5] rounded-[6px] border border-[#d1d5db] transition-colors disabled:opacity-50 cursor-pointer"
            >
              🔄
            </button>
            <Link to="/equipment/new" className="btn-nav">
              + List Equipment
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#166534] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#6b7280] text-base font-medium">Loading your listings...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-[10px] text-center max-w-[600px] mx-auto">
            <p className="font-semibold text-lg mb-1">Unable to Load Listings</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-5 py-2 bg-[#166534] text-white rounded-[6px] text-sm font-semibold hover:bg-[#14532d] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-[10px] border border-[#e5e7eb]">
            <div className="text-4xl mb-3">🚜</div>
            <h3 className="text-xl font-bold text-[#1f2937] mb-2">No Listings Yet</h3>
            <p className="text-[#6b7280] max-w-md mx-auto mb-6 text-sm">
              You have not listed any equipment yet. Create your first listing to start receiving rental requests.
            </p>
            <Link
              to="/equipment/new"
              className="inline-block px-5 py-2.5 bg-[#166534] text-white rounded-[6px] font-semibold hover:bg-[#14532d] transition-colors"
            >
              List Your Equipment
            </Link>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <>
            <p className="text-sm text-[#6b7280] mb-4">
              {listings.length} listing{listings.length === 1 ? '' : 's'}
            </p>

            {/* Desktop / tablet: card grid with edit actions */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <EquipmentCard
                    equipment={{
                      ...item,
                      availabilityNote: formatAvailabilityNote(item),
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <AvailabilityStatusBadge status={getAvailabilityStatus(item)} />
                    <Link
                      to={`/equipment/${item.id}/edit`}
                      className="text-sm font-semibold text-[#166534] hover:underline"
                    >
                      Edit listing
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: compact list rows */}
            <div className="md:hidden space-y-4">
              {listings.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden flex flex-col sm:flex-row"
                >
                  <EquipmentImage
                    src={item.image}
                    alt={item.imageAlt || item.name}
                    className="w-full sm:w-[140px] h-[140px] sm:h-auto object-cover shrink-0"
                  />
                  <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
                    <span className="tag self-start">{item.category}</span>
                    <h3 className="text-[1.05rem] font-bold text-[#1f2937] truncate">{item.name}</h3>
                    <p className="text-[#6b7280] text-sm">
                      📍 {item.state} · {item.city}
                    </p>
                    <p className="text-[1.1rem] font-bold text-[#166534]">
                      ₹{item.pricePerDay.toLocaleString('en-IN')}{' '}
                      <span className="text-[0.85rem] font-normal text-[#6b7280]">/ day</span>
                    </p>
                    <AvailabilityStatusBadge status={getAvailabilityStatus(item)} />
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Link to={`/equipment/${item.id}`} className="btn-view flex-1 text-center">
                        View Details
                      </Link>
                      <Link
                        to={`/equipment/${item.id}/edit`}
                        className="flex-1 text-center px-4 py-2 border border-[#d1d5db] rounded-[6px] bg-white text-[#1f2937] font-semibold text-sm hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

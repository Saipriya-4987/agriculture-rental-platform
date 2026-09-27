import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getEquipmentById,
  deleteEquipment,
  hasRole,
  createBooking,
  isAuthenticated,
  getUserRole,
  getEquipmentReviews,
  type Equipment,
  type Review,
} from '../services/api'

interface FormErrors {
  rentalFrom?: string
  rentalUntil?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

const DEFAULT_OWNER_NAME = 'Ramesh Naidu'

const DEFAULT_DESCRIPTION = '45 HP diesel tractor, well maintained, suitable for ploughing, '
  + 'tilling and general farm haulage. Comes with standard 2WD and power steering.'

const DEFAULT_FEATURES: string[] = [
  '45 HP diesel engine',
  'Power steering',
  '2WD',
  'Attachment-ready hitch',
]

const DEFAULT_AVAILABILITY_WINDOWS: string[] = [
  '01 Oct 2026 – 05 Oct 2026',
  '10 Oct 2026 – 20 Oct 2026',
  '25 Oct 2026 – 31 Oct 2026',
]

function EquipmentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  const [rentalFrom, setRentalFrom] = useState<string>('')
  const [rentalUntil, setRentalUntil] = useState<string>('')
  const [handoverMethod, setHandoverMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false)

  useEffect(() => {
    let ignore = false

    const fetchEquipment = !id
      ? Promise.reject(new Error('No equipment ID provided'))
      : getEquipmentById(id)

    fetchEquipment
      .then((data) => {
        if (!ignore) {
          setEquipment(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load equipment details')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    const fetchReviews = !id
      ? Promise.resolve([])
      : getEquipmentReviews(id)

    fetchReviews
      .then((revs) => {
        if (!ignore) {
          setReviews(revs)
          setReviewsError(null)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setReviewsError(err instanceof Error ? err.message : 'Failed to load reviews')
        }
      })
      .finally(() => {
        if (!ignore) {
          setReviewsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [id])

  function validateRentalForm(): FormErrors {
    const newErrors: FormErrors = {}

    if (rentalFrom === '') {
      newErrors.rentalFrom = 'Please choose a rental start date.'
    }

    if (rentalUntil === '') {
      newErrors.rentalUntil = 'Please choose a rental end date.'
    }

    if (rentalFrom !== '' && rentalUntil !== '' && rentalUntil < rentalFrom) {
      newErrors.rentalUntil = 'Rental Until date cannot be earlier than Rental From date.'
    }

    return newErrors
  }

  async function handleRentalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors = validateRentalForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
      return
    }

    if (!equipment) return

    try {
      setIsBookingSubmitting(true)
      setMessage(null)

      const response = await createBooking({
        equipmentId: equipment.id,
        startDate: rentalFrom,
        endDate: rentalUntil,
        handoverMethod,
      })

      setMessage({
        text: `Booking request placed successfully! Booking ID #${response.booking.id} (Status: ${response.booking.status}). Total: ₹${response.booking.totalAmount.toLocaleString('en-IN')}.`,
        type: 'success',
      })
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to submit booking request.',
        type: 'error',
      })
    } finally {
      setIsBookingSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!id || !equipment) return
    const confirmed = window.confirm(`Are you sure you want to delete "${equipment.name}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteEquipment(id)
      setDeleteSuccess(true)
      setTimeout(() => {
        navigate('/equipment')
      }, 1000)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete equipment.')
      setIsDeleting(false)
    }
  }

  function handleRetry() {
    if (!id) return
    setLoading(true)
    setError(null)
    getEquipmentById(id)
      .then((data) => {
        setEquipment(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load equipment details')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 text-base font-medium">Loading equipment details...</p>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="py-20 max-w-[600px] mx-auto px-5 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Equipment Not Found</h2>
          <p className="text-sm mb-5">{error || 'Could not find the requested equipment listing.'}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors cursor-pointer text-sm"
            >
              Retry
            </button>
            <Link
              to="/equipment"
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              &larr; Back to Browse Equipment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ownerName = equipment.owner || DEFAULT_OWNER_NAME
  const ratingStars = equipment.rating !== undefined && equipment.rating > 0
    ? '★'.repeat(Math.min(5, Math.max(1, Math.round(equipment.rating)))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.round(equipment.rating)))))
    : '☆☆☆☆☆'
  const ratingCount = equipment.ratingCount !== undefined && equipment.ratingCount > 0
    ? `(${equipment.rating} · ${equipment.ratingCount} reviews)`
    : '(No reviews yet)'

  const description = equipment.description || DEFAULT_DESCRIPTION
  const features = equipment.features && equipment.features.length > 0 ? equipment.features : DEFAULT_FEATURES

  let availabilityList = DEFAULT_AVAILABILITY_WINDOWS
  if (equipment.availability && equipment.availability.length > 0) {
    availabilityList = equipment.availability
  } else if (equipment.availabilityFrom && equipment.availabilityTo) {
    availabilityList = [`${equipment.availabilityFrom} – ${equipment.availabilityTo}`]
  }

  let calculatedDays = 0
  let calculatedTotal = 0
  if (rentalFrom && rentalUntil && rentalUntil >= rentalFrom && equipment) {
    const start = new Date(rentalFrom + 'T00:00:00Z')
    const end = new Date(rentalUntil + 'T00:00:00Z')
    const diffMs = end.getTime() - start.getTime()
    if (!isNaN(diffMs) && diffMs >= 0) {
      calculatedDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
      calculatedTotal = calculatedDays * equipment.pricePerDay
    }
  }

  return (
    <>
      <section className="py-8 pb-12">
        <div className="max-w-[1100px] mx-auto px-5">
          <Link to="/equipment" className="inline-block mb-5 text-green-800 font-semibold hover:underline">
            &larr; Back to search
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
            {/* LEFT: gallery */}
            <div>
              <img src={equipment.image} alt={equipment.imageAlt || equipment.name} className="w-full h-[320px] object-cover rounded-xl" />
              <div className="flex gap-2.5 mt-2.5">
                <img src="https://placehold.co/150x100?text=1" alt="Equipment view 1" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
                <img src="https://placehold.co/150x100?text=2" alt="Equipment view 2" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
                <img src="https://placehold.co/150x100?text=3" alt="Equipment view 3" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
              </div>
            </div>

            {/* RIGHT: info panel */}
            <div>
              <span className="inline-block bg-green-100 text-green-800 text-xs font-bold uppercase px-2 py-1 rounded w-fit">{equipment.category}</span>
              <h1 className="text-[1.8rem] my-2 mx-0">{equipment.name}</h1>

              <p className="text-gray-700 mb-1">
                Listed by <strong>{ownerName}</strong>
                <span className="ml-2 text-amber-500 font-semibold">{ratingStars} <span className="text-gray-500 font-normal text-sm">{ratingCount}</span></span>
              </p>

              <p className="text-gray-500 text-sm">📍 {equipment.city}, {equipment.state}</p>

              <p className="text-[1.6rem] font-bold text-green-800 my-4">
                ₹{equipment.pricePerDay.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">/ day</span>
              </p>

              <a href="#request-section" className="inline-block bg-amber-500 text-white font-bold px-7 py-3 rounded-md mb-7 hover:bg-amber-600">Book Now</a>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Description</h2>
                <p>{description}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Features</h2>
                <ul className="pl-5 text-gray-700">
                  {features.map((feature) => (
                    <li key={feature} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Availability</h2>
                <ul className="pl-5 text-gray-700">
                  {availabilityList.map((window) => (
                    <li key={window} className="mb-1">{window}</li>
                  ))}
                </ul>
              </div>

              {/* RENTAL/BOOKING REQUEST FORM */}
              <div id="request-section" className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-[1.2rem] font-bold text-gray-900 mb-2">Request to Rent</h2>

                {message && (
                  <div
                    className={`p-3.5 rounded-lg mb-4 text-sm font-medium ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                    aria-live="polite"
                  >
                    {message.text}
                  </div>
                )}

                {!isAuthenticated() ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
                    <p className="font-semibold text-gray-800 mb-1">Want to rent this machine?</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Please log in with your <strong>Farmer</strong> account to select rental dates and submit a booking request.
                    </p>
                    <Link
                      to="/login"
                      className="inline-block px-5 py-2.5 bg-green-800 text-white font-semibold text-sm rounded-md hover:bg-green-900 transition-colors"
                    >
                      Log in to Book
                    </Link>
                  </div>
                ) : getUserRole() !== 'FARMER' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
                    <p>
                      Logged in as <strong className="text-gray-800">{getUserRole()}</strong>. Rental bookings can only be requested by Farmer accounts.
                    </p>
                  </div>
                ) : (
                  <form className="flex flex-col gap-4" onSubmit={handleRentalSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rental-from" className="text-sm font-semibold mb-1.5 block text-gray-700">
                          Rental Start Date
                        </label>
                        <input
                          type="date"
                          id="rental-from"
                          name="rental_from"
                          aria-label="Rental from"
                          value={rentalFrom}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalFrom(event.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        {errors.rentalFrom && (
                          <span className="text-red-600 text-xs block mt-1">{errors.rentalFrom}</span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="rental-until" className="text-sm font-semibold mb-1.5 block text-gray-700">
                          Rental End Date
                        </label>
                        <input
                          type="date"
                          id="rental-until"
                          name="rental_until"
                          aria-label="Rental until"
                          value={rentalUntil}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalUntil(event.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        {errors.rentalUntil && (
                          <span className="text-red-600 text-xs block mt-1">{errors.rentalUntil}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="handover-method" className="text-sm font-semibold mb-1.5 block text-gray-700">
                        Handover Method
                      </label>
                      <select
                        id="handover-method"
                        value={handoverMethod}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setHandoverMethod(event.target.value as 'PICKUP' | 'DELIVERY')
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md w-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                      >
                        <option value="PICKUP">Self Pickup (Collect from Owner location)</option>
                        <option value="DELIVERY">Delivery to Farm (Coordinated with Owner)</option>
                      </select>
                    </div>

                    {calculatedDays > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900 flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{calculatedDays} day{calculatedDays > 1 ? 's' : ''}</span>
                          <span className="text-xs text-green-700 ml-1.5">(@ ₹{equipment.pricePerDay.toLocaleString('en-IN')}/day)</span>
                        </div>
                        <div className="text-base font-bold text-green-900">
                          Total: ₹{calculatedTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isBookingSubmitting}
                      className="w-full py-2.5 px-4 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBookingSubmitting ? 'Submitting Request...' : 'Confirm & Request to Rent'}
                    </button>
                  </form>
                )}
              </div>

              {/* OWNER ACTIONS: Edit and Delete (Accessible to OWNER role) */}
              {hasRole('OWNER') && (
                <div className="mb-6 pt-6 border-t border-gray-200">
                  <h2 className="text-[1.1rem] mb-3">Manage Listing</h2>

                  {deleteError && (
                    <p className="p-3 rounded-md mb-3 bg-red-100 text-red-800 text-sm" aria-live="polite">
                      {deleteError}
                    </p>
                  )}

                  {deleteSuccess ? (
                    <p className="p-3 rounded-md mb-3 bg-green-100 text-green-800 text-sm" aria-live="polite">
                      Equipment deleted successfully. Redirecting to equipment list...
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/equipment/${equipment.id}/edit`}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-colors"
                      >
                        Edit Equipment
                      </Link>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-red-300 rounded-md bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Equipment'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="pb-16 pt-8 border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Farmer Reviews & Ratings</h2>
              <p className="text-gray-600 text-sm mt-0.5">
                Authentic feedback from farmers who completed rentals for this equipment.
              </p>
            </div>
            {equipment && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs">
                <span className="text-amber-500 text-lg">★</span>
                <span className="font-bold text-gray-900 text-base">
                  {equipment.rating ? equipment.rating.toFixed(1) : (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'New')}
                </span>
                <span className="text-xs text-gray-500">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="inline-block w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500 text-sm">Loading verified reviews...</p>
            </div>
          ) : reviewsError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700 shadow-xs">
              <p className="mb-3 font-medium">{reviewsError}</p>
              <button
                type="button"
                onClick={() => {
                  if (id) {
                    setReviewsLoading(true)
                    getEquipmentReviews(id)
                      .then((revs) => {
                        setReviews(revs)
                        setReviewsError(null)
                      })
                      .catch((err) => setReviewsError(err instanceof Error ? err.message : 'Failed to load reviews'))
                      .finally(() => setReviewsLoading(false))
                  }
                }}
                className="px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
              <span className="text-3xl mb-2 block">🌾</span>
              <h3 className="font-bold text-gray-800 text-sm mb-1">No Reviews Yet</h3>
              <p className="text-gray-500 text-xs max-w-[360px] mx-auto">
                No farmer reviews have been submitted for this equipment yet. Be the first to rent and share your experience!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-900 font-bold text-xs flex items-center justify-center border border-green-200">
                        {rev.reviewer?.name ? rev.reviewer.name.charAt(0).toUpperCase() : 'F'}
                      </div>
                      <div>
                        <strong className="text-sm text-gray-900 block leading-tight">
                          {rev.reviewer?.name || 'Verified Farmer'}
                        </strong>
                        <span className="text-[11px] text-gray-400">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Rental'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < rev.rating ? 'text-amber-500' : 'text-gray-200'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {rev.comment ? (
                    <p className="text-sm text-gray-700 mt-2">
                      "{rev.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      No written feedback provided.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default EquipmentDetails

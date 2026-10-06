import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import EquipmentImage from '../components/EquipmentImage'
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
  agreement?: string
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
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false)
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

    if (!agreementAccepted) {
      newErrors.agreement = 'Please agree to the rental agreement and terms to proceed.'
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
        agreementAccepted,
      })

      setMessage({
        text: `Booking request placed successfully! Booking ID #${response.booking.id} (Status: ${response.booking.status}). Total: ₹${response.booking.totalAmount.toLocaleString('en-IN')}. Rental agreement v1.0 accepted.`,
        type: 'success',
      })
      setAgreementAccepted(false)
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
      <section className="py-8 pb-12 bg-[#f9fafb]">
        <div className="max-w-[1100px] mx-auto px-5">
          <Link to="/equipment" className="inline-block mb-5 text-[#166534] font-semibold hover:underline">
            &larr; Back to search
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
            {/* LEFT: gallery */}
            <div className="gallery">
              <EquipmentImage
                src={equipment.image}
                alt={equipment.imageAlt || equipment.name}
                className="w-full h-[320px] object-cover rounded-[10px]"
              />
            </div>

            {/* RIGHT: info panel */}
            <div className="info-panel">
              <span className="tag">{equipment.category}</span>
              <h1 className="text-[1.8rem] font-bold text-[#1f2937] my-2">{equipment.name}</h1>

              <p className="text-[#374151] mb-1">
                Listed by <strong>{ownerName}</strong>
                <span className="ml-2 text-[#f59e0b] font-semibold">{ratingStars} <span className="text-[#6b7280] font-normal text-sm">{ratingCount}</span></span>
              </p>

              <p className="text-[#6b7280] text-sm mb-3">📍 {equipment.city}, {equipment.state}</p>

              <p className="text-[1.6rem] font-bold text-[#166534] my-4">
                ₹{equipment.pricePerDay.toLocaleString('en-IN')} <span className="text-[0.9rem] font-normal text-[#6b7280]">/ day</span>
              </p>

              <a href="#request-section" className="btn-book mb-7">Book Now</a>

              <div className="mb-6">
                <h2 className="text-[1.1rem] font-bold text-[#1f2937] mb-2">Description</h2>
                <p className="text-[#374151] leading-relaxed">{description}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] font-bold text-[#1f2937] mb-2">Features</h2>
                <ul className="pl-5 text-[#374151] list-disc space-y-1">
                  {features.map((feature) => (
                    <li key={feature} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] font-bold text-[#1f2937] mb-2">Availability</h2>
                <ul className="pl-5 text-[#374151] list-disc space-y-1">
                  {availabilityList.map((window) => (
                    <li key={window} className="mb-1">{window}</li>
                  ))}
                </ul>
              </div>

              {/* RENTAL/BOOKING REQUEST FORM */}
              <div id="request-section" className="mb-6 bg-white border border-[#e5e7eb] rounded-[10px] p-6 shadow-sm">
                <h2 className="text-[1.2rem] font-bold text-[#1f2937] mb-3">Request to Rent</h2>

                {message && (
                  <div
                    className={`p-3.5 rounded-[6px] mb-4 text-sm font-medium ${
                      message.type === 'success'
                        ? 'bg-green-50 text-[#166534] border border-[#d1fae5]'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                    aria-live="polite"
                  >
                    {message.text}
                  </div>
                )}

                {!isAuthenticated() ? (
                  <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-[6px] p-5 text-center">
                    <p className="font-semibold text-[#14532d] mb-1">Want to rent this machine?</p>
                    <p className="text-sm text-[#374151] mb-4">
                      Please log in with your <strong>Farmer</strong> account to select rental dates and submit a booking request.
                    </p>
                    <Link
                      to="/login"
                      className="btn-nav"
                    >
                      Log in to Book
                    </Link>
                  </div>
                ) : getUserRole() !== 'FARMER' ? (
                  <div className="bg-gray-50 border border-[#e5e7eb] rounded-[6px] p-4 text-center text-sm text-[#6b7280]">
                    <p>
                      Logged in as <strong className="text-[#1f2937]">{getUserRole()}</strong>. Rental bookings can only be requested by Farmer accounts.
                    </p>
                  </div>
                ) : (
                  <form className="flex flex-col gap-4" onSubmit={handleRentalSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rental-from" className="text-sm font-semibold mb-1.5 block text-[#374151]">
                          Rental Start Date
                        </label>
                        <input
                          type="date"
                          id="rental-from"
                          name="rental_from"
                          aria-label="Rental from"
                          value={rentalFrom}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalFrom(event.target.value)}
                          className="px-3.5 py-2.5 border border-[#d1d5db] rounded-[6px] w-full text-base text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
                        />
                        {errors.rentalFrom && (
                          <span className="text-red-600 text-xs block mt-1">{errors.rentalFrom}</span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="rental-until" className="text-sm font-semibold mb-1.5 block text-[#374151]">
                          Rental End Date
                        </label>
                        <input
                          type="date"
                          id="rental-until"
                          name="rental_until"
                          aria-label="Rental until"
                          value={rentalUntil}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalUntil(event.target.value)}
                          className="px-3.5 py-2.5 border border-[#d1d5db] rounded-[6px] w-full text-base text-[#1f2937] bg-white focus:outline-none focus:border-[#166534]"
                        />
                        {errors.rentalUntil && (
                          <span className="text-red-600 text-xs block mt-1">{errors.rentalUntil}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="handover-method" className="text-sm font-semibold mb-1.5 block text-[#374151]">
                        Handover Method
                      </label>
                      <select
                        id="handover-method"
                        value={handoverMethod}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setHandoverMethod(event.target.value as 'PICKUP' | 'DELIVERY')
                        }
                        className="px-3.5 py-2.5 border border-[#d1d5db] rounded-[6px] w-full bg-white text-[#1f2937] focus:outline-none focus:border-[#166534]"
                      >
                        <option value="PICKUP">Self Pickup (Collect from Owner location)</option>
                        <option value="DELIVERY">Delivery to Farm (Coordinated with Owner)</option>
                      </select>
                    </div>

                    {calculatedDays > 0 && (
                      <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-[6px] p-3 text-sm text-[#14532d] flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{calculatedDays} day{calculatedDays > 1 ? 's' : ''}</span>
                          <span className="text-xs text-[#166534] ml-1.5">(@ ₹{equipment.pricePerDay.toLocaleString('en-IN')}/day)</span>
                        </div>
                        <div className="text-base font-bold text-[#166534]">
                          Total: ₹{calculatedTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    {/* RENTAL AGREEMENT CLAUSES & MANDATORY ACCEPTANCE (PRD §7.5 FR-AGR-01/02) */}
                    <div className="border border-[#e5e7eb] rounded-[6px] p-3.5 bg-[#f9fafb]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#1f2937] uppercase tracking-wider flex items-center gap-1.5">
                          📜 Rental Agreement Terms (v1.0)
                        </span>
                        <span className="text-[10px] font-semibold text-[#166534] bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded">
                          Mandatory
                        </span>
                      </div>

                      <div className="text-xs text-[#4b5563] space-y-1.5 mb-3 bg-white p-3 rounded-[6px] border border-[#e5e7eb] max-h-36 overflow-y-auto leading-relaxed">
                        <div>
                          <strong className="text-[#1f2937]">1. Authorized Use:</strong> Equipment must be used solely for legitimate agricultural operations by qualified operators.
                        </div>
                        <div>
                          <strong className="text-[#1f2937]">2. No Resale or Subletting:</strong> Renter shall not sublease, transfer, assign, or resell the rented machinery to any third party.
                        </div>
                        <div>
                          <strong className="text-[#1f2937]">3. Damage Responsibility:</strong> Renter assumes responsibility for damage, loss, or negligence beyond normal wear and tear occurring during the rental period.
                        </div>
                        <div>
                          <strong className="text-[#1f2937]">4. Return Period:</strong> Equipment must be returned to the owner or made available for return handover on or before the agreed end date.
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="agreement-checkbox"
                          name="agreement_accepted"
                          checked={agreementAccepted}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setAgreementAccepted(e.target.checked)
                            if (e.target.checked && errors.agreement) {
                              setErrors((prev) => ({ ...prev, agreement: undefined }))
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#166534] focus:ring-[#166534] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#1f2937]">
                          I agree to the rental agreement and terms.
                        </span>
                      </label>
                      {errors.agreement && (
                        <span className="text-red-600 text-xs block mt-1.5 font-medium">
                          {errors.agreement}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isBookingSubmitting || !agreementAccepted}
                      className="btn-auth disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBookingSubmitting ? 'Submitting Request...' : 'Confirm & Request to Rent'}
                    </button>
                  </form>
                )}
              </div>

              {/* OWNER ACTIONS: Edit and Delete (Accessible to OWNER role) */}
              {hasRole('OWNER') && (
                <div className="mb-6 pt-6 border-t border-[#e5e7eb]">
                  <h2 className="text-[1.1rem] font-bold text-[#1f2937] mb-3">Manage Listing</h2>

                  {deleteError && (
                    <p className="p-3 rounded-[6px] mb-3 bg-red-100 text-red-800 text-sm" aria-live="polite">
                      {deleteError}
                    </p>
                  )}

                  {deleteSuccess ? (
                    <p className="p-3 rounded-[6px] mb-3 bg-green-100 text-[#166534] text-sm" aria-live="polite">
                      Equipment deleted successfully. Redirecting to equipment list...
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/equipment/${equipment.id}/edit`}
                        className="px-4 py-2 border border-[#d1d5db] rounded-[6px] bg-white text-[#1f2937] font-semibold text-sm hover:bg-gray-50 transition-colors"
                      >
                        Edit Equipment
                      </Link>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-red-300 rounded-[6px] bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      <section className="pb-16 pt-8 border-t border-[#e5e7eb] bg-[#f9fafb]">
        <div className="max-w-[1100px] mx-auto px-5">
          <h2 className="text-[1.4rem] font-bold text-[#1f2937] mb-5">
            Reviews{' '}
            <span className="text-[0.95rem] font-normal text-[#6b7280] ml-2">
              {equipment.rating ? equipment.rating.toFixed(1) : (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'New')}{' '}
              average · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </h2>

          {reviewsLoading ? (
            <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-[8px]">
              <div className="inline-block w-6 h-6 border-2 border-[#166534] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-[#6b7280] text-sm">Loading verified reviews...</p>
            </div>
          ) : reviewsError ? (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-6 text-center text-sm text-red-700">
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
                className="px-4 py-1.5 bg-[#166534] text-white font-semibold text-xs rounded-[6px] hover:bg-[#14532d] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-[8px] p-6">
              <span className="text-3xl mb-2 block">🌾</span>
              <h3 className="font-bold text-[#1f2937] text-sm mb-1">No Reviews Yet</h3>
              <p className="text-[#6b7280] text-xs max-w-[360px] mx-auto">
                No farmer reviews have been submitted for this equipment yet. Be the first to rent and share your experience!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-[#e5e7eb] rounded-[8px] p-4">
                  <p className="text-[#f59e0b] text-[0.95rem]">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </p>
                  <p className="text-[#1f2937] my-1.5 text-base">
                    "{rev.comment || 'Great machine, worked fine for our farm.'}"
                  </p>
                  <p className="text-[#6b7280] text-[0.85rem]">
                    &mdash; {rev.reviewer?.name || 'Verified Farmer'}
                  </p>
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
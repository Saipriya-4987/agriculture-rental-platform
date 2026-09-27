import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getEquipmentById, deleteEquipment, type Equipment } from '../services/api'

interface Review {
  stars: string
  text: string
  author: string
}

interface FormErrors {
  rentalFrom?: string
  rentalUntil?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

const DEFAULT_OWNER_NAME = 'Ramesh Naidu'
const DEFAULT_RATING_STARS = '★★★★☆'
const DEFAULT_RATING_COUNT = '(4.2 · 18 reviews)'

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

const REVIEWS: Review[] = [
  {
    stars: '★★★★★',
    text: '"Tractor was in great condition and Ramesh was easy to coordinate pickup with."',
    author: '— Suresh K., Farmer',
  },
  {
    stars: '★★★★☆',
    text: '"Good machine, slightly delayed handover but worked fine for our harvest."',
    author: '— Lakshmi P., Farmer',
  },
]

function EquipmentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [rentalFrom, setRentalFrom] = useState<string>('')
  const [rentalUntil, setRentalUntil] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false)

  useEffect(() => {
    let ignore = false

    const fetchPromise = !id
      ? Promise.reject(new Error('No equipment ID provided'))
      : getEquipmentById(id)

    fetchPromise
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

  function handleRentalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors = validateRentalForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage({ text: 'Rental request submitted successfully.', type: 'success' })
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
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
    : DEFAULT_RATING_STARS
  const ratingCount = equipment.ratingCount !== undefined && equipment.ratingCount > 0
    ? `(${equipment.rating} · ${equipment.ratingCount} reviews)`
    : DEFAULT_RATING_COUNT

  const description = equipment.description || DEFAULT_DESCRIPTION
  const features = equipment.features && equipment.features.length > 0 ? equipment.features : DEFAULT_FEATURES

  let availabilityList = DEFAULT_AVAILABILITY_WINDOWS
  if (equipment.availability && equipment.availability.length > 0) {
    availabilityList = equipment.availability
  } else if (equipment.availabilityFrom && equipment.availabilityTo) {
    availabilityList = [`${equipment.availabilityFrom} – ${equipment.availabilityTo}`]
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
              <div id="request-section" className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Request to Rent</h2>

                {message && (
                  <p className={`p-3 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} aria-live="polite">
                    {message.text}
                  </p>
                )}

                <form className="flex flex-col" onSubmit={handleRentalSubmit}>
                  <div className="mb-4">
                    <label htmlFor="rental-from" className="text-sm font-semibold mb-1.5 block">Rental From</label>
                    <input
                      type="date"
                      id="rental-from"
                      name="rental_from"
                      aria-label="Rental from"
                      value={rentalFrom}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalFrom(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md w-full"
                    />
                    {errors.rentalFrom && <span className="text-red-600 text-sm block mt-1">{errors.rentalFrom}</span>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="rental-until" className="text-sm font-semibold mb-1.5 block">Rental Until</label>
                    <input
                      type="date"
                      id="rental-until"
                      name="rental_until"
                      aria-label="Rental until"
                      value={rentalUntil}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setRentalUntil(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md w-full"
                    />
                    {errors.rentalUntil && <span className="text-red-600 text-sm block mt-1">{errors.rentalUntil}</span>}
                  </div>

                  <button type="submit" className="px-4 py-2 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900 cursor-pointer">Request to Rent</button>
                </form>
              </div>

              {/* OWNER ACTIONS: Edit and Delete */}
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
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="pb-12">
        <div className="max-w-[1100px] mx-auto px-5">
          <h2 className="text-[1.4rem] mb-5">Reviews <span className="text-sm font-normal text-gray-500 ml-2">4.2 average · 18 reviews</span></h2>

          {REVIEWS.map((review) => (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3" key={review.author}>
              <p className="text-amber-500 text-sm">{review.stars}</p>
              <p className="my-1.5 mx-0">{review.text}</p>
              <p className="text-gray-500 text-sm">{review.author}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default EquipmentDetails

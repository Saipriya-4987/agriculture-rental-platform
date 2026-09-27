import { useState, FormEvent, ChangeEvent } from 'react'
import equipmentData from '../data/equipmentData.js'

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

// M3 step 6: Equipment Details page component.
// Based on the <section class="details-section"> + <section
// class="reviews-section"> markup in frontend/equipment-details.html.
//
// There's no React Router yet, so this isn't a dynamic "/equipment/:id"
// page - like the original vanilla HTML file, it always shows ONE
// specific listing. It looks that listing (Mahindra 575 DI, id 1) up in
// the shared equipmentData array so name/category/state/city/price still
// come from the same mock data source as Home and EquipmentList, instead
// of being re-typed here.
//
// The rest of the page's content - owner, rating, description, features,
// the 3 availability windows, and the 2 reviews - has no matching fields
// in equipmentData (Home/EquipmentList never needed them), so it's kept
// as page-local constants, copied verbatim from the original HTML.
const equipment = equipmentData.find((item) => item.id === 1)

const OWNER_NAME = 'Ramesh Naidu'
const RATING_STARS = '★★★★☆'
const RATING_COUNT = '(4.2 · 18 reviews)'

const DESCRIPTION = '45 HP diesel tractor, well maintained, suitable for ploughing, '
  + 'tilling and general farm haulage. Comes with standard 2WD and power steering.'

const FEATURES: string[] = [
  '45 HP diesel engine',
  'Power steering',
  '2WD',
  'Attachment-ready hitch',
]

const AVAILABILITY_WINDOWS: string[] = [
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
  // Rental request form (frontend-only demo, migrated from js/main.js's
  // rentalForm block): controlled inputs + the same validation rules,
  // now expressed as React state instead of DOM error <span>s.
  const [rentalFrom, setRentalFrom] = useState<string>('')
  const [rentalUntil, setRentalUntil] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  if (!equipment) {
    return null
  }

  // Same three rules as main.js's validateRentalForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
  function validateRentalForm(): FormErrors {
    const newErrors: FormErrors = {}

    if (rentalFrom === '') {
      newErrors.rentalFrom = 'Please choose a rental start date.'
    }

    if (rentalUntil === '') {
      newErrors.rentalUntil = 'Please choose a rental end date.'
    }

    // Same "YYYY-MM-DD" plain-string comparison used by the Home page's
    // date filters - only checked once both dates are present, so this
    // doesn't pile a second error onto an already-empty field.
    if (rentalFrom !== '' && rentalUntil !== '' && rentalUntil < rentalFrom) {
      newErrors.rentalUntil = 'Rental Until date cannot be earlier than Rental From date.'
    }

    return newErrors
  }

  function handleRentalSubmit(event: FormEvent<HTMLFormElement>) {
    // This is a frontend-only demo - never actually creates a booking.
    event.preventDefault()

    const newErrors = validateRentalForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage({ text: 'Rental request submitted successfully.', type: 'success' })
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <>
      {/* EQUIPMENT DETAILS SECTION (FR-DSC-03, CORE text version):
          images, price/day, features, owner name + rating, availability, location. */}
      <section className="py-8 pb-12">
        <div className="max-w-[1100px] mx-auto px-5">

          <a href="index.html" className="inline-block mb-5 text-green-800 font-semibold hover:underline">&larr; Back to search</a>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">

            {/* LEFT: gallery */}
            <div>
              <img src={equipment.image} alt={equipment.imageAlt} className="w-full h-[320px] object-cover rounded-xl" />
              <div className="flex gap-2.5 mt-2.5">
                <img src="https://placehold.co/150x100?text=1" alt="Tractor front view" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
                <img src="https://placehold.co/150x100?text=2" alt="Tractor side view" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
                <img src="https://placehold.co/150x100?text=3" alt="Tractor with attachment" className="w-[90px] h-[60px] object-cover rounded-md border border-gray-200" />
              </div>
            </div>

            {/* RIGHT: info panel */}
            <div>
              <span className="inline-block bg-green-100 text-green-800 text-xs font-bold uppercase px-2 py-1 rounded w-fit">{equipment.category}</span>
              <h1 className="text-[1.8rem] my-2 mx-0">{equipment.name}</h1>

              <p className="text-gray-700 mb-1">
                Listed by <strong>{OWNER_NAME}</strong>
                <span className="ml-2 text-amber-500 font-semibold">{RATING_STARS} <span className="text-gray-500 font-normal text-sm">{RATING_COUNT}</span></span>
              </p>

              <p className="text-gray-500 text-sm">📍 {equipment.city}, {equipment.state}</p>

              <p className="text-[1.6rem] font-bold text-green-800 my-4">
                ₹{equipment.pricePerDay.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">/ day</span>
              </p>

              <a href="#" className="inline-block bg-amber-500 text-white font-bold px-7 py-3 rounded-md mb-7 hover:bg-amber-600">Book Now</a>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Description</h2>
                <p>{DESCRIPTION}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Features</h2>
                <ul className="pl-5 text-gray-700">
                  {FEATURES.map((feature) => (
                    <li key={feature} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-[1.1rem] mb-2">Availability</h2>
                <ul className="pl-5 text-gray-700">
                  {AVAILABILITY_WINDOWS.map((window) => (
                    <li key={window} className="mb-1">{window}</li>
                  ))}
                </ul>
              </div>

              {/* RENTAL/BOOKING REQUEST FORM (frontend-only demo, M2 -> M3):
                  same client-side date validation + success message as
                  js/main.js's rentalForm block, now controlled by useState
                  instead of reading the DOM on submit. */}
              <div className="mb-6">
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

                  <button type="submit" className="px-4 py-2 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900">Request to Rent</button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* REVIEWS SECTION (FR-REV-02: ratings/reviews shown on details page) */}
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

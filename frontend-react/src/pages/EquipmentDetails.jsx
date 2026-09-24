import { useState } from 'react'
import equipmentData from '../data/equipmentData.js'

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

const FEATURES = [
  '45 HP diesel engine',
  'Power steering',
  '2WD',
  'Attachment-ready hitch',
]

const AVAILABILITY_WINDOWS = [
  '01 Oct 2026 – 05 Oct 2026',
  '10 Oct 2026 – 20 Oct 2026',
  '25 Oct 2026 – 31 Oct 2026',
]

const REVIEWS = [
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
  const [rentalFrom, setRentalFrom] = useState('')
  const [rentalUntil, setRentalUntil] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)

  // Same three rules as main.js's validateRentalForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
  function validateRentalForm() {
    const newErrors = {}

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

  function handleRentalSubmit(event) {
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
      <section className="details-section">
        <div className="container">

          <a href="index.html" className="back-link">&larr; Back to search</a>

          <div className="details-grid">

            {/* LEFT: gallery */}
            <div className="gallery">
              <img src={equipment.image} alt={equipment.imageAlt} className="main-image" />
              <div className="thumbnail-row">
                <img src="https://placehold.co/150x100?text=1" alt="Tractor front view" />
                <img src="https://placehold.co/150x100?text=2" alt="Tractor side view" />
                <img src="https://placehold.co/150x100?text=3" alt="Tractor with attachment" />
              </div>
            </div>

            {/* RIGHT: info panel */}
            <div className="info-panel">
              <span className="tag">{equipment.category}</span>
              <h1>{equipment.name}</h1>

              <p className="owner-line">
                Listed by <strong>{OWNER_NAME}</strong>
                <span className="rating">{RATING_STARS} <span className="rating-count">{RATING_COUNT}</span></span>
              </p>

              <p className="location">📍 {equipment.city}, {equipment.state}</p>

              <p className="price-box">
                ₹{equipment.pricePerDay.toLocaleString('en-IN')} <span>/ day</span>
              </p>

              <a href="#" className="btn-book">Book Now</a>

              <div className="detail-block">
                <h2>Description</h2>
                <p>{DESCRIPTION}</p>
              </div>

              <div className="detail-block">
                <h2>Features</h2>
                <ul className="feature-list">
                  {FEATURES.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h2>Availability</h2>
                <ul className="availability-list">
                  {AVAILABILITY_WINDOWS.map((window) => (
                    <li key={window}>{window}</li>
                  ))}
                </ul>
              </div>

              {/* RENTAL/BOOKING REQUEST FORM (frontend-only demo, M2 -> M3):
                  same client-side date validation + success message as
                  js/main.js's rentalForm block, now controlled by useState
                  instead of reading the DOM on submit. */}
              <div className="detail-block">
                <h2>Request to Rent</h2>

                {message && (
                  <p className={`form-message ${message.type}`} aria-live="polite">
                    {message.text}
                  </p>
                )}

                <form className="auth-form" onSubmit={handleRentalSubmit}>
                  <label htmlFor="rental-from">Rental From</label>
                  <input
                    type="date"
                    id="rental-from"
                    name="rental_from"
                    aria-label="Rental from"
                    value={rentalFrom}
                    onChange={(event) => setRentalFrom(event.target.value)}
                  />
                  {errors.rentalFrom && <span className="field-error">{errors.rentalFrom}</span>}

                  <label htmlFor="rental-until">Rental Until</label>
                  <input
                    type="date"
                    id="rental-until"
                    name="rental_until"
                    aria-label="Rental until"
                    value={rentalUntil}
                    onChange={(event) => setRentalUntil(event.target.value)}
                  />
                  {errors.rentalUntil && <span className="field-error">{errors.rentalUntil}</span>}

                  <button type="submit" className="btn-auth">Request to Rent</button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* REVIEWS SECTION (FR-REV-02: ratings/reviews shown on details page) */}
      <section className="reviews-section">
        <div className="container">
          <h2>Reviews <span className="reviews-average">4.2 average · 18 reviews</span></h2>

          {REVIEWS.map((review) => (
            <div className="review-card" key={review.author}>
              <p className="review-stars">{review.stars}</p>
              <p className="review-text">{review.text}</p>
              <p className="review-author">{review.author}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default EquipmentDetails
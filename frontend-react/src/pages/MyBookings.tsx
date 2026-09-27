import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyBookings,
  cancelBooking,
  activateBooking,
  completeBooking,
  createReview,
  type Booking,
} from '../services/api'

type TabType = 'all' | 'current' | 'past'

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)

  // Review form state
  const [reviewingBookingId, setReviewingBookingId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyBookings()
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(bookingId: number) {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await cancelBooking(bookingId)
      setActionMessage({ text: 'Booking request cancelled successfully.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to cancel booking.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleActivate(bookingId: number) {
    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await activateBooking(bookingId)
      setActionMessage({ text: 'Handover confirmed! Your rental is now ACTIVE.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to activate rental.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleComplete(bookingId: number) {
    if (!window.confirm('Confirm that the equipment has been returned to the owner and rental is complete?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await completeBooking(bookingId)
      setActionMessage({ text: 'Equipment returned! Rental marked as COMPLETED.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to complete rental.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  function handleStartReview(booking: Booking) {
    setReviewingBookingId(booking.id)
    setReviewRating(5)
    setReviewComment('')
    setReviewError(null)
  }

  function handleCancelReview() {
    setReviewingBookingId(null)
    setReviewRating(5)
    setReviewComment('')
    setReviewError(null)
  }

  async function handleSubmitReview(e: React.FormEvent, bookingId: number) {
    e.preventDefault()
    setIsSubmittingReview(true)
    setReviewError(null)
    try {
      const res = await createReview({
        bookingId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      })

      setActionMessage({
        text: 'Review submitted successfully! Thank you for rating this equipment.',
        type: 'success',
      })

      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === bookingId) {
            return {
              ...b,
              isReviewed: true,
              reviews: [res.review, ...(b.reviews || [])],
            }
          }
          return b
        })
      )

      setReviewingBookingId(null)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const currentBookings = useMemo(
    () => bookings.filter((b) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(b.status)),
    [bookings]
  )

  const pastBookings = useMemo(
    () => bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)),
    [bookings]
  )

  const displayedBookings = useMemo(() => {
    if (activeTab === 'current') return currentBookings
    if (activeTab === 'past') return pastBookings
    return bookings
  }, [activeTab, bookings, currentBookings, pastBookings])

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Approval
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Confirmed • Ready for Handover
          </span>
        )
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Active Rental • In Use
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">
            ✓ Returned & Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-600 border border-gray-200">
            ✕ Cancelled
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
            ✕ Request Declined
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  return (
    <section className="py-8 pb-16 min-h-[75vh]">
      <div className="max-w-[1050px] mx-auto px-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Rental Bookings</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Review your complete rental history, track active rentals, and manage equipment return.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBookings}
              disabled={loading}
              title="Refresh bookings"
              className="p-2 text-gray-600 hover:text-green-800 hover:bg-green-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              🔄
            </button>
            <Link
              to="/equipment"
              className="px-4 py-2 bg-green-800 text-white font-semibold text-sm rounded-lg hover:bg-green-900 transition-colors shadow-sm"
            >
              + Find Equipment
            </Link>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block">Total Bookings</span>
              <span className="text-xl font-bold text-gray-900">{bookings.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-amber-700 font-medium block">Pending Approval</span>
              <span className="text-xl font-bold text-amber-700">
                {bookings.filter((b) => b.status === 'PENDING').length}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-emerald-700 font-medium block">Active Rentals</span>
              <span className="text-xl font-bold text-emerald-700">
                {bookings.filter((b) => b.status === 'ACTIVE').length}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-blue-700 font-medium block">Completed Rentals</span>
              <span className="text-xl font-bold text-blue-700">
                {bookings.filter((b) => b.status === 'COMPLETED').length}
              </span>
            </div>
          </div>
        )}

        {/* Alert Notifications */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center justify-between shadow-xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'all'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'current'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Current & Upcoming ({currentBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'past'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Past & History ({pastBookings.length})
          </button>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="inline-block w-8 h-8 border-3 border-green-800 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600 font-medium">Loading your booking history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-xs">
            <p className="text-red-800 font-semibold mb-3">{error}</p>
            <button
              onClick={loadBookings}
              className="px-5 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
            <span className="text-4xl mb-3 block">🌾</span>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {activeTab === 'current'
                ? 'No Active or Upcoming Bookings'
                : activeTab === 'past'
                ? 'No Past Rental History'
                : 'No Bookings Found'}
            </h2>
            <p className="text-gray-600 text-sm mb-6 max-w-[420px] mx-auto">
              {activeTab === 'current'
                ? 'You do not have any ongoing rentals or pending requests right now.'
                : activeTab === 'past'
                ? 'Completed, cancelled, and rejected rentals will appear in your past history.'
                : "You haven't requested any equipment rentals yet. Browse available tractors, harvesters, and tillers!"}
            </p>
            <Link
              to="/equipment"
              className="px-6 py-2.5 bg-green-800 text-white font-semibold text-sm rounded-lg hover:bg-green-900 transition-colors inline-block shadow-sm"
            >
              Browse Available Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Header row: Equipment name + status + price */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    {booking.equipment?.image ? (
                      <img
                        src={booking.equipment.image}
                        alt={booking.equipment.name || 'Equipment'}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-green-50 rounded-xl border border-green-200 flex items-center justify-center text-2xl flex-shrink-0">
                        🚜
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <Link
                          to={`/equipment/${booking.equipmentId}`}
                          className="font-bold text-lg text-gray-900 hover:text-green-800 transition-colors"
                        >
                          {booking.equipment?.name || `Equipment #${booking.equipmentId}`}
                        </Link>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Booking #{booking.id} • Category: {booking.equipment?.category || 'Agricultural Machinery'} • Created{' '}
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                    <p className="text-xl font-extrabold text-green-900">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''} rental (₹{booking.equipment?.pricePerDay || Math.round(booking.totalAmount / booking.totalDays)}/day)
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-sm text-gray-700">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Rental Period</span>
                    <strong className="text-gray-900 text-sm">
                      📅 {booking.startDate} → {booking.endDate}
                    </strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Handover Mode</span>
                    <strong className="text-gray-900 text-sm">
                      {booking.handoverMethod === 'DELIVERY' ? '🚚 Delivery to Farm' : '🏪 Self Pickup'}
                    </strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Location</span>
                    <span className="text-gray-800 text-sm font-semibold">
                      📍 {booking.equipment?.city || 'Local district'}, {booking.equipment?.state || ''}
                    </span>
                  </div>
                </div>

                {/* Owner Rejection Notice */}
                {booking.rejectionReason && booking.status === 'REJECTED' && (
                  <div className="mt-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    <strong className="font-semibold block mb-0.5">Reason for Cancellation / Rejection:</strong>
                    <p className="text-red-700">{booking.rejectionReason}</p>
                  </div>
                )}

                {/* Return Flow Guidance Card */}
                {booking.status === 'ACTIVE' && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <span>
                      🌾 <strong>Rental in progress:</strong> Once you are done using the equipment and have returned it to the owner, click <strong>Return Equipment</strong> to complete this rental.
                    </span>
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                    <span>
                      🤝 <strong>Booking Approved:</strong> Meet with the owner or await delivery. When handover occurs, click <strong>Start Rental</strong> to mark it active.
                    </span>
                  </div>
                )}

                {/* Completed Rental Review Notice / Badge */}
                {booking.status === 'COMPLETED' && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                    {booking.isReviewed || (booking.reviews && booking.reviews.length > 0) ? (
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="text-amber-500 font-bold">★ Reviewed</span>
                          <span>Rating: {booking.reviews?.[0]?.rating || 5}/5</span>
                        </span>
                        {booking.reviews?.[0]?.comment && (
                          <span className="text-gray-500 italic truncate max-w-[280px]">
                            "{booking.reviews[0].comment}"
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-gray-700">
                        <span>
                          ⭐ <strong>Rental Complete:</strong> How was your experience? Share feedback to help other farmers!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Review Form for Completed Bookings */}
                {reviewingBookingId === booking.id && (
                  <form
                    onSubmit={(e) => handleSubmitReview(e, booking.id)}
                    className="mt-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      Review & Rate {booking.equipment?.name || 'Equipment'}
                    </h4>

                    {reviewError && (
                      <div className="p-2 mb-3 bg-red-100 border border-red-200 text-red-800 text-xs rounded-md">
                        {reviewError}
                      </div>
                    )}

                    {/* Star Rating Selector */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold block text-gray-700 mb-1">
                        Your Rating (1 to 5 Stars) *
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <span className={star <= reviewRating ? 'text-amber-500' : 'text-gray-300'}>
                              ★
                            </span>
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-gray-700">
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    {/* Optional Comment */}
                    <div className="mb-3">
                      <label htmlFor={`review-comment-${booking.id}`} className="text-xs font-semibold block text-gray-700 mb-1">
                        Written Feedback / Experience (Optional)
                      </label>
                      <textarea
                        id={`review-comment-${booking.id}`}
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe how the machinery performed, condition, handover experience, etc."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelReview}
                        disabled={isSubmittingReview}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Actions Bar */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {booking.status === 'COMPLETED' && (
                      <span className="text-gray-600 font-medium">✓ Equipment returned and verified.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    {booking.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleActivate(booking.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {activeActionId === booking.id ? 'Starting...' : 'Start Rental (Take Handover)'}
                      </button>
                    )}

                    {booking.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleComplete(booking.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {activeActionId === booking.id ? 'Completing...' : 'Return Equipment (Complete Rental)'}
                      </button>
                    )}

                    {/* Leave Review Action for Completed Bookings */}
                    {booking.status === 'COMPLETED' &&
                      !booking.isReviewed &&
                      (!booking.reviews || booking.reviews.length === 0) &&
                      reviewingBookingId !== booking.id && (
                        <button
                          type="button"
                          onClick={() => handleStartReview(booking)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-xs"
                        >
                          ★ Leave Review
                        </button>
                      )}

                    <Link
                      to={`/equipment/${booking.equipmentId}`}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Equipment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

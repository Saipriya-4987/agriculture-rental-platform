import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyBookings,
  cancelBooking,
  pickupBooking,
  requestReturnBooking,
  createReview,
  type Booking,
} from '../services/api'
import { StatusTimeline } from '../components/StatusTimeline'

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

  async function handlePickup(bookingId: number) {
    if (!window.confirm('Confirm that you have physically received and inspected the equipment? This will immediately start your rental.')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await pickupBooking(bookingId)
      setActionMessage({ text: 'Receipt confirmed! Rental is now ACTIVE.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to confirm pickup.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleRequestReturn(bookingId: number) {
    if (!window.confirm('Confirm that you are ready to return this equipment to the owner?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await requestReturnBooking(bookingId)
      setActionMessage({ text: 'Return requested! Coordinate with owner to physically return the machinery.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to request return.',
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
    () =>
      bookings.filter((b) =>
        ['PENDING', 'CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED'].includes(
          b.status
        )
      ),
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Approval
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Confirmed • Awaiting Preparation
          </span>
        )
      case 'READY_FOR_HANDOVER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Ready for Handover • Awaiting Your Pickup
          </span>
        )
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Equipment Picked Up • Ready to Start
          </span>
        )
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-[4px] bg-green-100 text-[#166534] border border-[#166534]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
            Active Rental • In Use
          </span>
        )
      case 'RETURN_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
            Return Requested • Awaiting Owner
          </span>
        )
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Equipment Returned • Owner Inspecting
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-100 text-gray-800 border border-gray-300">
            ✓ Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-50 text-gray-600 border border-gray-200">
            ✕ Cancelled
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-red-50 text-red-700 border border-red-200">
            ✕ Request Declined
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  return (
    <section className="py-8 pb-16 min-h-[75vh] bg-[#f9fafb]">
      <div className="max-w-[1100px] mx-auto px-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937]">My Rental Bookings</h1>
            <p className="text-[#6b7280] text-sm mt-0.5">
              Review your complete rental history, track active rentals, and manage equipment return.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBookings}
              disabled={loading}
              title="Refresh bookings"
              className="p-2 text-gray-600 hover:text-[#166534] hover:bg-[#ecfdf5] rounded-[6px] border border-[#d1d5db] transition-colors disabled:opacity-50 cursor-pointer"
            >
              🔄
            </button>
            <Link
              to="/equipment"
              className="btn-nav"
            >
              Browse Equipment
            </Link>
          </div>
        </div>

        {/* Global Action Banner */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-[8px] flex items-center justify-between text-sm ${
              actionMessage.type === 'success'
                ? 'bg-[#ecfdf5] border border-[#d1fae5] text-[#14532d]'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{actionMessage.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex border-b border-[#e5e7eb] mb-6 gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'all'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'current'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            In-Progress ({currentBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'past'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past / Completed ({pastBookings.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-12 text-center text-gray-500 shadow-sm">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <p className="text-sm">Loading your bookings...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-8 text-center text-red-700 shadow-sm">
            <p className="font-semibold mb-2">Failed to load bookings</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={loadBookings}
              className="px-4 py-2 bg-[#166534] text-white rounded-[6px] text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedBookings.length === 0 && (
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3">🚜</span>
            <h3 className="text-lg font-bold text-[#1f2937] mb-1">
              {activeTab === 'all'
                ? 'No rental bookings found'
                : activeTab === 'current'
                ? 'No in-progress rentals'
                : 'No past rentals yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
              {activeTab === 'all'
                ? 'You have not placed any equipment rental requests yet. Explore our verified machinery directory!'
                : activeTab === 'current'
                ? 'You do not have any active or pending rentals right now.'
                : 'Completed and closed rentals will show up here.'}
            </p>
            <Link
              to="/equipment"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-sm font-semibold rounded-[6px] transition-colors"
            >
              Browse Equipment Directory →
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && displayedBookings.length > 0 && (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header: Title + Status + Price */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#f3f4f6]">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={booking.equipment?.image || 'https://placehold.co/120x90?text=Equipment'}
                      alt={booking.equipment?.name || 'Equipment'}
                      className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-[8px] border border-[#e5e7eb] flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <Link
                          to={`/equipment/${booking.equipmentId}`}
                          className="font-bold text-lg text-[#1f2937] hover:text-[#166534] transition-colors"
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

                  <div className="text-left md:text-right bg-[#f9fafb] md:bg-transparent p-3 md:p-0 rounded-[6px]">
                    <p className="text-xl font-extrabold text-[#166534]">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''} rental (₹{booking.equipment?.pricePerDay || Math.round(booking.totalAmount / booking.totalDays)}/day)
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-sm text-[#1f2937]">
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Rental Period</span>
                    <strong className="text-[#1f2937] text-sm">
                      📅 {booking.startDate} → {booking.endDate}
                    </strong>
                  </div>
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Handover Mode</span>
                    <strong className="text-[#1f2937] text-sm">
                      {booking.handoverMethod === 'DELIVERY' ? '🚚 Delivery to Farm' : '🏪 Self Pickup'}
                    </strong>
                  </div>
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Location</span>
                    <span className="text-[#1f2937] text-sm font-semibold">
                      📍 {booking.equipment?.city || 'Local district'}, {booking.equipment?.state || ''}
                    </span>
                  </div>
                </div>

                {/* Rental Agreement Acceptance status */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 pb-1 border-t border-[#f3f4f6] text-xs">
                  <div className="flex items-center gap-1.5 text-[#166534]">
                    <span className="font-semibold bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                      ✓ Rental Agreement Accepted ({booking.agreementAcceptance?.agreementVersion || 'v1.0'})
                    </span>
                    <span className="text-gray-500 hidden sm:inline">
                      • Terms legally bound to this rental
                    </span>
                  </div>
                  {booking.agreementAcceptance?.acceptedAt && (
                    <span className="text-[11px] text-gray-400">
                      Signed {new Date(booking.agreementAcceptance.acceptedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Status-specific Guidance Banners */}
                {booking.status === 'PENDING' && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-xs text-amber-900">
                    ⏳ <strong>Waiting for owner:</strong> Your request was sent to the owner for review. You can cancel if plans change.
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-xs text-blue-900">
                    🤝 <strong>Booking Approved:</strong> The owner is preparing the equipment. Once ready, they will mark it ready for handover.
                  </div>
                )}

                {booking.status === 'READY_FOR_HANDOVER' && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-[8px] text-xs text-emerald-900">
                    🎉 <strong>Equipment Ready!</strong> The owner has prepared the equipment. Please meet to take possession, inspect condition, and confirm receipt below.
                  </div>
                )}

                {booking.status === 'PICKED_UP' && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-[8px] text-xs text-teal-900">
                    🚜 <strong>Equipment In Possession:</strong> You have received the machinery. Click <strong>Start Active Rental</strong> to officially begin your rental period.
                  </div>
                )}

                {booking.status === 'ACTIVE' && (
                  <div className="mt-2 p-3 bg-[#ecfdf5] border border-[#d1fae5] rounded-[8px] text-xs text-[#14532d]">
                    🌾 <strong>Rental in progress:</strong> When your work is finished and you are ready to return the machinery to the owner, click <strong>Request Equipment Return</strong>.
                  </div>
                )}

                {booking.status === 'RETURN_REQUESTED' && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-[8px] text-xs text-purple-900">
                    🔄 <strong>Return Requested:</strong> You have initiated return. Please physically deliver the equipment to the owner so they can confirm receipt.
                  </div>
                )}

                {booking.status === 'RETURNED' && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-[8px] text-xs text-indigo-900">
                    🔍 <strong>Equipment Returned:</strong> The owner has physically received the machinery and is conducting post-rental inspection before completing.
                  </div>
                )}

                {booking.rejectionReason && booking.status === 'REJECTED' && (
                  <div className="mt-2 p-3.5 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-800">
                    <strong className="font-semibold block mb-0.5">Reason for Cancellation / Rejection:</strong>
                    <p className="text-red-700">{booking.rejectionReason}</p>
                  </div>
                )}

                {/* Status Timeline & Audit Trail */}
                <StatusTimeline status={booking.status} events={booking.statusEvents} />

                {/* Inline Review Form for Completed Bookings */}
                {reviewingBookingId === booking.id && (
                  <form
                    onSubmit={(e) => handleSubmitReview(e, booking.id)}
                    className="mt-3 p-4 bg-amber-50/60 border border-amber-200 rounded-[8px]"
                  >
                    <h4 className="text-sm font-bold text-[#1f2937] mb-2">
                      Review & Rate {booking.equipment?.name || 'Equipment'}
                    </h4>

                    {reviewError && (
                      <div className="p-2 mb-3 bg-red-100 border border-red-200 text-red-800 text-xs rounded-[6px]">
                        {reviewError}
                      </div>
                    )}

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
                            <span className={star <= reviewRating ? 'text-[#f59e0b]' : 'text-gray-300'}>
                              ★
                            </span>
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-gray-700">
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

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
                        className="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-[6px] focus:outline-none focus:border-[#166534] bg-white text-[#1f2937]"
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelReview}
                        disabled={isSubmittingReview}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-[#d1d5db] text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Actions Bar (Strict Role Mapping) */}
                <div className="mt-3 pt-3 border-t border-[#f3f4f6] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {booking.status === 'COMPLETED' && (
                      <span className="text-gray-600 font-medium">✓ Rental closed and verified by owner.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    {/* FARMER: PENDING -> CANCELLED */}
                    {booking.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}

                    {/* FARMER: READY_FOR_HANDOVER -> PICKED_UP -> ACTIVE (atomic two-party handover) */}
                    {booking.status === 'READY_FOR_HANDOVER' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handlePickup(booking.id)}
                        className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {activeActionId === booking.id ? 'Confirming...' : '🤝 Confirm Receipt & Start Rental'}
                      </button>
                    )}

                    {/* FARMER: ACTIVE -> RETURN_REQUESTED */}
                    {booking.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleRequestReturn(booking.id)}
                        className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-purple-700 hover:bg-purple-800 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {activeActionId === booking.id ? 'Submitting...' : '🔄 Request Equipment Return'}
                      </button>
                    )}

                    {/* Review Action (Only for COMPLETED) */}
                    {booking.status === 'COMPLETED' &&
                      !booking.isReviewed &&
                      (!booking.reviews || booking.reviews.length === 0) &&
                      reviewingBookingId !== booking.id && (
                        <button
                          type="button"
                          onClick={() => handleStartReview(booking)}
                          className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#f59e0b] hover:bg-[#d97706] text-white transition-colors cursor-pointer shadow-sm"
                        >
                          ★ Leave Review
                        </button>
                      )}

                    <Link
                      to={`/equipment/${booking.equipmentId}`}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-[#d1d5db] text-gray-700 hover:bg-gray-50 transition-colors"
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

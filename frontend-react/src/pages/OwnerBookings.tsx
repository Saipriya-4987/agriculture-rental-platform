import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  activateBooking,
  completeBooking,
  type Booking,
} from '../services/api'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)

  // Rejection modal/prompt state
  const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const data = await getOwnerBookings()
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking requests.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(bookingId: number) {
    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await confirmBooking(bookingId)
      setActionMessage({ text: 'Booking request confirmed successfully!', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to confirm booking.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingBookingId) return

    setActiveActionId(rejectingBookingId)
    setActionMessage(null)
    try {
      const res = await rejectBooking(rejectingBookingId, rejectionReason.trim())
      setActionMessage({ text: 'Booking request rejected.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === rejectingBookingId ? res.booking : b))
      )
      setRejectingBookingId(null)
      setRejectionReason('')
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to reject booking.',
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
      setActionMessage({ text: 'Equipment handed over! Booking marked as ACTIVE.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to activate booking.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleComplete(bookingId: number) {
    if (!window.confirm('Confirm that the equipment has been safely returned to your possession?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await completeBooking(bookingId)
      setActionMessage({ text: 'Rental completed and equipment marked as returned.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to complete booking.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">⏳ Needs Review</span>
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">✓ Confirmed (Awaiting Handover)</span>
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">🚜 Active Rental</span>
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-300">🏁 Completed</span>
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">✕ Cancelled by Farmer</span>
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">✕ Rejected</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>
    }
  }

  return (
    <section className="py-8 pb-16 min-h-[70vh]">
      <div className="max-w-[1000px] mx-auto px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Booking Requests</h1>
            <p className="text-gray-600 text-sm">Review, confirm, and coordinate rental bookings for your agricultural equipment.</p>
          </div>
          <Link
            to="/equipment/new"
            className="self-start sm:self-auto px-4 py-2 bg-green-800 text-white font-semibold text-sm rounded-md hover:bg-green-900 transition-colors"
          >
            + Add New Listing
          </Link>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 rounded-lg mb-6 text-sm font-medium ${
              actionMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-600">Loading booking requests...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={loadBookings}
              className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-md hover:bg-red-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8">
            <span className="text-4xl mb-3 block">📋</span>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No Booking Requests Received</h2>
            <p className="text-gray-600 text-sm mb-6 max-w-[420px] mx-auto">
              When farmers request to rent your tractors or equipment, their requests will appear here for your review and approval.
            </p>
            <Link
              to="/equipment"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold text-sm rounded-md hover:bg-gray-50 transition-colors inline-block"
            >
              View All Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        to={`/equipment/${booking.equipmentId}`}
                        className="font-bold text-lg text-gray-900 hover:text-green-800 transition-colors"
                      >
                        {booking.equipment?.name || `Equipment #${booking.equipmentId}`}
                      </Link>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Booking ID: #{booking.id} • Received on{' '}
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xl font-bold text-green-900">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''} rental
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-sm text-gray-700">
                  <div>
                    <span className="text-xs text-gray-500 block">Farmer Contact</span>
                    <strong className="text-gray-900">
                      {booking.farmer?.name || 'Farmer'}
                    </strong>
                    <span className="text-xs text-gray-500 block">
                      {booking.farmer?.phone || booking.farmer?.email || 'Contact on file'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Requested Period</span>
                    <strong className="text-gray-900">
                      {booking.startDate} to {booking.endDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Handover Method</span>
                    <strong className="text-gray-900">
                      {booking.handoverMethod === 'DELIVERY' ? '🚚 Delivery to Farm' : '🏪 Self Pickup'}
                    </strong>
                  </div>
                </div>

                {booking.rejectionReason && booking.status === 'REJECTED' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                    <strong>Rejection Reason:</strong> {booking.rejectionReason}
                  </div>
                )}

                {/* Inline Rejection Reason Form */}
                {rejectingBookingId === booking.id && (
                  <form onSubmit={handleRejectSubmit} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <label htmlFor={`reject-reason-${booking.id}`} className="text-xs font-semibold block text-gray-700 mb-1">
                      Reason for Rejection (Optional)
                    </label>
                    <input
                      type="text"
                      id={`reject-reason-${booking.id}`}
                      placeholder="e.g. Equipment undergoing maintenance on those dates"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingBookingId(null)
                          setRejectionReason('')
                        }}
                        className="px-3 py-1 text-xs font-semibold rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={activeActionId === booking.id}
                        className="px-3 py-1 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Owner Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  {booking.status === 'PENDING' && !rejectingBookingId && (
                    <>
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleConfirm(booking.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-md bg-green-800 text-white hover:bg-green-900 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Confirming...' : '✓ Confirm Booking'}
                      </button>
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => setRejectingBookingId(booking.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={activeActionId === booking.id}
                      onClick={() => handleActivate(booking.id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-md bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {activeActionId === booking.id ? 'Activating...' : 'Mark Handover Complete (Active)'}
                    </button>
                  )}

                  {booking.status === 'ACTIVE' && (
                    <button
                      type="button"
                      disabled={activeActionId === booking.id}
                      onClick={() => handleComplete(booking.id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {activeActionId === booking.id ? 'Completing...' : 'Mark Returned (Completed)'}
                    </button>
                  )}

                  <Link
                    to={`/equipment/${booking.equipmentId}`}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Listing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

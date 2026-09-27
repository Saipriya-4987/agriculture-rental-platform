import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  activateBooking,
  completeBooking,
  type Booking,
} from '../services/api'

type TabType = 'all' | 'pending' | 'active' | 'past'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)

  // Rejection modal/form state
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
    if (!window.confirm('Confirm that the equipment has been safely returned to your possession and inspected?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await completeBooking(bookingId)
      setActionMessage({ text: 'Rental completed and equipment marked as safely returned.', type: 'success' })
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

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING'),
    [bookings]
  )

  const activeBookings = useMemo(
    () => bookings.filter((b) => ['CONFIRMED', 'ACTIVE'].includes(b.status)),
    [bookings]
  )

  const pastBookings = useMemo(
    () => bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)),
    [bookings]
  )

  const displayedBookings = useMemo(() => {
    if (activeTab === 'pending') return pendingBookings
    if (activeTab === 'active') return activeBookings
    if (activeTab === 'past') return pastBookings
    return bookings
  }, [activeTab, bookings, pendingBookings, activeBookings, pastBookings])

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Needs Review
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
            Active • Out on Rent
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
            ✕ Cancelled by Farmer
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
            ✕ Rejected
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Owner Bookings & Handover Management</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Review rental requests from farmers, coordinate handovers, and track equipment returns.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBookings}
              disabled={loading}
              title="Refresh requests"
              className="p-2 text-gray-600 hover:text-green-800 hover:bg-green-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              🔄
            </button>
            <Link
              to="/equipment/new"
              className="px-4 py-2 bg-green-800 text-white font-semibold text-sm rounded-lg hover:bg-green-900 transition-colors shadow-sm"
            >
              + List Equipment
            </Link>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block">Total Requests</span>
              <span className="text-xl font-bold text-gray-900">{bookings.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-amber-700 font-medium block">Action Needed</span>
              <span className="text-xl font-bold text-amber-700">{pendingBookings.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-emerald-700 font-medium block">Out on Rent</span>
              <span className="text-xl font-bold text-emerald-700">
                {bookings.filter((b) => b.status === 'ACTIVE').length}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs text-blue-700 font-medium block">Successfully Returned</span>
              <span className="text-xl font-bold text-blue-700">
                {bookings.filter((b) => b.status === 'COMPLETED').length}
              </span>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
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
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Needs Review ({pendingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Active & Handover ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'past'
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Completed & History ({pastBookings.length})
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="inline-block w-8 h-8 border-3 border-green-800 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600 font-medium">Loading booking requests for your equipment...</p>
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
            <span className="text-4xl mb-3 block">📋</span>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {activeTab === 'pending'
                ? 'No Pending Requests'
                : activeTab === 'active'
                ? 'No Active Rentals'
                : activeTab === 'past'
                ? 'No Past Rental Records'
                : 'No Booking Requests Received'}
            </h2>
            <p className="text-gray-600 text-sm mb-6 max-w-[440px] mx-auto">
              {activeTab === 'pending'
                ? 'Great job! You have answered all pending rental requests.'
                : activeTab === 'active'
                ? 'None of your equipment is currently active on rent or awaiting handover.'
                : activeTab === 'past'
                ? 'Archived, completed, and rejected rentals will appear in this section.'
                : 'When farmers submit rental requests for your machinery, they will appear here.'}
            </p>
            <Link
              to="/equipment"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 transition-colors inline-block"
            >
              View My Equipment Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
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
                      Booking #{booking.id} • Received on{' '}
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>

                  <div className="text-left md:text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                    <p className="text-xl font-extrabold text-green-900">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''} rental income
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-sm text-gray-700">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Farmer Contact</span>
                    <strong className="text-gray-900 text-sm block">
                      👤 {booking.farmer?.name || 'Registered Farmer'}
                    </strong>
                    <span className="text-xs text-gray-600 block mt-0.5">
                      📞 {booking.farmer?.phone || booking.farmer?.email || 'Contact on file'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Requested Period</span>
                    <strong className="text-gray-900 text-sm block">
                      📅 {booking.startDate} → {booking.endDate}
                    </strong>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {booking.totalDays} day duration
                    </span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block font-medium">Handover Mode</span>
                    <strong className="text-gray-900 text-sm block">
                      {booking.handoverMethod === 'DELIVERY' ? '🚚 Delivery to Farmer' : '🏪 Self Pickup'}
                    </strong>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      📍 {booking.equipment?.city || 'Local district'}
                    </span>
                  </div>
                </div>

                {/* Rejection reason display */}
                {booking.rejectionReason && booking.status === 'REJECTED' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    <strong className="font-semibold block mb-0.5">Recorded Rejection Reason:</strong>
                    <p className="text-red-700">{booking.rejectionReason}</p>
                  </div>
                )}

                {/* Handover & Return guidance banners */}
                {booking.status === 'CONFIRMED' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    🤝 <strong>Awaiting Handover:</strong> Coordinate with the farmer for equipment transfer. Once handed over or dispatched, click <strong>Mark Handover Complete</strong>.
                  </div>
                )}

                {booking.status === 'ACTIVE' && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    🚜 <strong>Equipment In Use:</strong> The farmer is currently using this equipment. When returned and verified, click <strong>Mark Returned</strong>.
                  </div>
                )}

                {/* Inline Rejection Reason Form */}
                {rejectingBookingId === booking.id && (
                  <form onSubmit={handleRejectSubmit} className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <label htmlFor={`reject-reason-${booking.id}`} className="text-xs font-semibold block text-gray-700 mb-1">
                      Reason for Declining (Optional - shared with farmer)
                    </label>
                    <input
                      type="text"
                      id={`reject-reason-${booking.id}`}
                      placeholder="e.g. Equipment scheduled for routine maintenance on those dates"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingBookingId(null)
                          setRejectionReason('')
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={activeActionId === booking.id}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Declining...' : 'Confirm Rejection'}
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
                    {booking.status === 'PENDING' && !rejectingBookingId && (
                      <>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => handleConfirm(booking.id)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {activeActionId === booking.id ? 'Confirming...' : '✓ Confirm Booking'}
                        </button>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => setRejectingBookingId(booking.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
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
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {activeActionId === booking.id ? 'Activating...' : 'Mark Handover Complete (Active)'}
                      </button>
                    )}

                    {booking.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleComplete(booking.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {activeActionId === booking.id ? 'Completing...' : 'Mark Returned (Completed)'}
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

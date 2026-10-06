import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getOwnerBookings,
  confirmBooking,
  rejectBooking,
  markReadyBooking,
  cancelBooking,
  confirmReturnBooking,
  completeBooking,
  type Booking,
} from '../services/api'
import { StatusTimeline } from '../components/StatusTimeline'

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

  async function handleMarkReady(bookingId: number) {
    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await markReadyBooking(bookingId)
      setActionMessage({ text: 'Equipment marked as ready for handover!', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to mark equipment ready.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }


  async function handleConfirmReturn(bookingId: number) {
    if (!window.confirm('Confirm that you have physically received the equipment back from the farmer?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await confirmReturnBooking(bookingId)
      setActionMessage({ text: 'Equipment return confirmed! Proceed to final inspection to complete rental.', type: 'success' })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      )
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to confirm equipment return.',
        type: 'error',
      })
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleComplete(bookingId: number) {
    if (!window.confirm('Confirm that the returned equipment has been inspected and rental can be closed as COMPLETED?')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await completeBooking(bookingId)
      setActionMessage({ text: 'Rental completed and closed successfully!', type: 'success' })
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

  async function handleCancel(bookingId: number) {
    if (!window.confirm('Are you sure you want to cancel this booking? This will cancel the reservation.')) {
      return
    }

    setActiveActionId(bookingId)
    setActionMessage(null)
    try {
      const res = await cancelBooking(bookingId, 'Cancelled by owner before handover')
      setActionMessage({ text: 'Booking cancelled successfully.', type: 'success' })
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

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING'),
    [bookings]
  )

  const activeBookings = useMemo(
    () =>
      bookings.filter((b) =>
        ['CONFIRMED', 'READY_FOR_HANDOVER', 'PICKED_UP', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED'].includes(
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
    if (activeTab === 'pending') return pendingBookings
    if (activeTab === 'active') return activeBookings
    if (activeTab === 'past') return pastBookings
    return bookings
  }, [activeTab, bookings, pendingBookings, activeBookings, pastBookings])

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Needs Review
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Confirmed • Prepare Handover
          </span>
        )
      case 'READY_FOR_HANDOVER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Ready for Handover • Awaiting Farmer Pickup
          </span>
        )
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Farmer Picked Up • Handover Complete
          </span>
        )
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-green-100 text-[#166534] border border-[#166534]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
            Active • Out on Rent
          </span>
        )
      case 'RETURN_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
            Return Requested • Awaiting Delivery Back
          </span>
        )
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Received Back • Inspection in Progress
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-100 text-gray-800 border border-gray-300">
            ✓ Returned & Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-gray-50 text-gray-600 border border-gray-200">
            ✕ Cancelled by Farmer
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-red-50 text-red-700 border border-red-200">
            ✕ Rejected
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937] tracking-tight">Owner Bookings & Handover Management</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Review rental requests from farmers, coordinate handovers, and track equipment returns.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBookings}
              disabled={loading}
              title="Refresh requests"
              className="p-2 text-gray-600 hover:text-[#166534] hover:bg-[#ecfdf5] rounded-[6px] border border-[#d1d5db] transition-colors disabled:opacity-50 cursor-pointer"
            >
              🔄
            </button>
            <Link
              to="/equipment/new"
              className="btn-nav"
            >
              + List Equipment
            </Link>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-3.5 shadow-sm">
              <span className="text-xs text-gray-500 font-medium block">Total Requests</span>
              <span className="text-xl font-bold text-[#1f2937]">{bookings.length}</span>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-3.5 shadow-sm">
              <span className="text-xs text-amber-700 font-medium block">Action Needed</span>
              <span className="text-xl font-bold text-amber-700">{pendingBookings.length}</span>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-3.5 shadow-sm">
              <span className="text-xs text-[#166534] font-medium block">Out on Rent</span>
              <span className="text-xl font-bold text-[#166534]">
                {bookings.filter((b) => b.status === 'ACTIVE').length}
              </span>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-3.5 shadow-sm">
              <span className="text-xs text-blue-700 font-medium block">Successfully Closed</span>
              <span className="text-xl font-bold text-blue-700">
                {bookings.filter((b) => b.status === 'COMPLETED').length}
              </span>
            </div>
          </div>
        )}

        {/* Global Action Message */}
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
            All Requests ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'pending'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Needs Approval ({pendingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'active'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            In-Progress / On Rent ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'past'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed & Closed ({pastBookings.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-12 text-center text-gray-500 shadow-sm">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <p className="text-sm">Loading booking requests...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-8 text-center text-red-700 shadow-sm">
            <p className="font-semibold mb-2">Failed to load booking requests</p>
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
            <span className="text-4xl block mb-3">📋</span>
            <h3 className="text-lg font-bold text-[#1f2937] mb-1">
              {activeTab === 'all'
                ? 'No rental requests yet'
                : activeTab === 'pending'
                ? 'No pending requests requiring your action'
                : activeTab === 'active'
                ? 'No currently active rentals'
                : 'No completed rentals yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
              {activeTab === 'all'
                ? 'When farmers book your equipment, their requests will appear here for you to approve or decline.'
                : 'Incoming bookings and state transitions will be tracked here.'}
            </p>
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
                        Booking #{booking.id} • Category: {booking.equipment?.category || 'Machinery'} • Placed on{' '}
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right bg-[#f9fafb] md:bg-transparent p-3 md:p-0 rounded-[6px]">
                    <p className="text-xl font-extrabold text-[#166534]">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total rental revenue ({booking.totalDays} day{booking.totalDays > 1 ? 's' : ''})
                    </p>
                  </div>
                </div>

                {/* Farmer Contact & Booking Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-sm text-[#1f2937]">
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Renting Farmer</span>
                    <strong className="text-[#1f2937] text-sm block">
                      👨‍🌾 {booking.farmer?.name || 'Farmer Customer'}
                    </strong>
                    {booking.farmer?.phone && (
                      <span className="text-xs text-gray-600">📞 {booking.farmer.phone}</span>
                    )}
                  </div>
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Rental Period</span>
                    <strong className="text-[#1f2937] text-sm block">
                      📅 {booking.startDate} → {booking.endDate}
                    </strong>
                    <span className="text-xs text-gray-600">
                      Duration: {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-[#f9fafb] p-2.5 rounded-[6px] border border-[#e5e7eb]">
                    <span className="text-xs text-gray-500 block font-medium">Handover Mode</span>
                    <strong className="text-[#1f2937] text-sm block">
                      {booking.handoverMethod === 'DELIVERY' ? '🚚 Deliver to Farmer' : '🏪 Farmer Self-Pickup'}
                    </strong>
                    <span className="text-xs text-gray-600">
                      Location: {booking.equipment?.city || 'Local area'}
                    </span>
                  </div>
                </div>

                {/* Rental Agreement status */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 pb-1 border-t border-[#f3f4f6] text-xs">
                  <div className="flex items-center gap-1.5 text-[#166534]">
                    <span className="font-semibold bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                      ✓ Rental Agreement Executed ({booking.agreementAcceptance?.agreementVersion || 'v1.0'})
                    </span>
                    <span className="text-gray-500 hidden sm:inline">
                      • Accepted by farmer before booking placement
                    </span>
                  </div>
                  {booking.agreementAcceptance?.acceptedAt && (
                    <span className="text-[11px] text-gray-400">
                      Accepted {new Date(booking.agreementAcceptance.acceptedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Handover & Return guidance banners */}
                {booking.status === 'CONFIRMED' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-xs text-blue-900">
                    🤝 <strong>Booking Confirmed:</strong> Prepare the machinery and complete pre-rental check. When ready for handover, click <strong>Mark Ready for Handover</strong> below.
                  </div>
                )}

                {booking.status === 'READY_FOR_HANDOVER' && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-[8px] text-xs text-emerald-900">
                    📦 <strong>Equipment Ready:</strong> Awaiting the farmer to inspect condition and confirm physical receipt.
                  </div>
                )}

                {booking.status === 'PICKED_UP' && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-[8px] text-xs text-teal-900">
                    🚜 <strong>Equipment Handed Over:</strong> The farmer has confirmed receipt. Click <strong>Start Rental (Mark Active)</strong> to officially start the active rental.
                  </div>
                )}

                {booking.status === 'ACTIVE' && (
                  <div className="mt-2 p-3 bg-[#ecfdf5] border border-[#d1fae5] rounded-[8px] text-xs text-[#14532d]">
                    🌾 <strong>Equipment In Field Use:</strong> The farmer is currently utilizing the equipment. Awaiting return request when usage concludes.
                  </div>
                )}

                {booking.status === 'RETURN_REQUESTED' && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-[8px] text-xs text-purple-900">
                    🔄 <strong>Return Requested by Farmer:</strong> The farmer is returning the machinery. When received back, click <strong>Confirm Equipment Returned</strong> below.
                  </div>
                )}

                {booking.status === 'RETURNED' && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-[8px] text-xs text-indigo-900">
                    🔍 <strong>Inspection Stage:</strong> Equipment has been physically returned. Inspect condition and click <strong>Complete Rental & Close Booking</strong>.
                  </div>
                )}

                {/* Status Timeline & Audit Trail */}
                <StatusTimeline status={booking.status} events={booking.statusEvents} />

                {/* Inline Rejection Reason Form */}
                {rejectingBookingId === booking.id && (
                  <form onSubmit={handleRejectSubmit} className="mt-3 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px]">
                    <label htmlFor={`reject-reason-${booking.id}`} className="text-xs font-semibold block text-gray-700 mb-1">
                      Reason for Declining (Optional - shared with farmer)
                    </label>
                    <input
                      type="text"
                      id={`reject-reason-${booking.id}`}
                      placeholder="e.g. Equipment scheduled for routine maintenance on those dates"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-[6px] mb-3 focus:outline-none focus:border-red-500 bg-white text-[#1f2937]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingBookingId(null)
                          setRejectionReason('')
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-[#d1d5db] text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={activeActionId === booking.id}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {activeActionId === booking.id ? 'Declining...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Actions Bar (Strict Role Mapping) */}
                <div className="mt-3 pt-3 border-t border-[#f3f4f6] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {booking.status === 'COMPLETED' && (
                      <span className="text-gray-600 font-medium">✓ Equipment returned and verified.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    {/* OWNER: PENDING -> CONFIRMED / REJECTED */}
                    {booking.status === 'PENDING' && !rejectingBookingId && (
                      <>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => handleConfirm(booking.id)}
                          className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {activeActionId === booking.id ? 'Confirming...' : '✓ Confirm Booking'}
                        </button>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => setRejectingBookingId(booking.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}

                    {/* OWNER: CONFIRMED -> READY_FOR_HANDOVER or CANCEL */}
                    {booking.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => handleMarkReady(booking.id)}
                          className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {activeActionId === booking.id ? 'Updating...' : '📦 Mark Ready for Handover'}
                        </button>
                        <button
                          type="button"
                          disabled={activeActionId === booking.id}
                          onClick={() => handleCancel(booking.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          ✕ Cancel Booking
                        </button>
                      </>
                    )}

                    {/* PICKED_UP -> ACTIVE is automatic upon farmer's pickup confirmation.
                        No owner action required or permitted for this transition. */}

                    {/* OWNER: RETURN_REQUESTED -> RETURNED */}
                    {booking.status === 'RETURN_REQUESTED' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleConfirmReturn(booking.id)}
                        className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {activeActionId === booking.id ? 'Confirming...' : '🤝 Confirm Equipment Returned'}
                      </button>
                    )}

                    {/* OWNER: RETURNED -> COMPLETED */}
                    {booking.status === 'RETURNED' && (
                      <button
                        type="button"
                        disabled={activeActionId === booking.id}
                        onClick={() => handleComplete(booking.id)}
                        className="px-4 py-1.5 text-xs font-bold rounded-[6px] bg-[#166534] hover:bg-[#14532d] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {activeActionId === booking.id ? 'Completing...' : '✓ Complete Rental (Close Booking)'}
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

import React, { useState } from 'react'
import type { StatusEvent } from '../services/api'

interface StatusTimelineProps {
  status: string
  events?: StatusEvent[]
}

const ORDERED_STEPS = [
  { key: 'PENDING', label: 'Requested' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'READY_FOR_HANDOVER', label: 'Ready' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'RETURN_REQUESTED', label: 'Return Req.' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'COMPLETED', label: 'Completed' },
]

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status, events = [] }) => {
  const [showHistory, setShowHistory] = useState(false)

  const isTerminalFailure = status === 'REJECTED' || status === 'CANCELLED'

  const currentStepIndex = ORDERED_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="mt-3 pt-3 border-t border-[#f3f4f6]">
      {/* Progress track for linear steps */}
      {!isTerminalFailure ? (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1 overflow-x-auto gap-1">
            {ORDERED_STEPS.map((step, idx) => {
              const isPast = currentStepIndex > idx
              const isCurrent = currentStepIndex === idx
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center min-w-[50px] text-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] mb-1 transition-colors ${
                      isCurrent
                        ? 'bg-[#166534] text-white ring-2 ring-[#d1fae5] font-bold'
                        : isPast
                        ? 'bg-[#ecfdf5] text-[#166534] border border-[#166534]'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`truncate max-w-[60px] ${
                      isCurrent ? 'text-[#166534] font-bold' : isPast ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-2 p-2 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
          <span>Booking Status: <strong className="text-red-700">{status}</strong></span>
        </div>
      )}

      {/* History toggle */}
      {events && events.length > 0 && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] text-[#166534] hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
          >
            {showHistory ? '▲ Hide Transition History' : `▼ View Lifecycle Timeline (${events.length} event${events.length > 1 ? 's' : ''})`}
          </button>

          {showHistory && (
            <div className="mt-2 text-left bg-[#f9fafb] p-3 rounded-[6px] border border-[#e5e7eb] text-xs space-y-2">
              <span className="font-semibold text-gray-700 block mb-1">Status Event Audit Trail:</span>
              {events.map((ev, i) => (
                <div key={ev.id || i} className="flex items-start justify-between border-b border-gray-100 pb-1.5 last:border-0 last:pb-0 gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1f2937]">{ev.toStatus}</span>
                      {ev.fromStatus && (
                        <span className="text-gray-400 text-[10px]">from {ev.fromStatus}</span>
                      )}
                      <span className="px-1.5 py-0.2 text-[10px] rounded bg-gray-200 text-gray-700 font-semibold">
                        by {ev.actorRole}
                      </span>
                    </div>
                    {ev.note && <p className="text-gray-600 italic text-[11px] mt-0.5">{ev.note}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

-- Migration: Add status_events table and update booking status check constraint
-- Core requirement TRD §7.1 / Booking Lifecycle State Machine

CREATE TABLE IF NOT EXISTS status_events (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_role VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_events_booking_id ON status_events(booking_id);

-- Ensure check constraint on bookings allows all 10 state machine statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN (
    'PENDING',
    'CONFIRMED',
    'READY_FOR_HANDOVER',
    'PICKED_UP',
    'ACTIVE',
    'RETURN_REQUESTED',
    'RETURNED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
));

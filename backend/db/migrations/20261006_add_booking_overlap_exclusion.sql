-- Migration: Add double-booking date overlap exclusion constraint
-- Core requirement TRD §7.2 / Double-Booking Protection
-- Uses btree_gist extension and GiST index on daterange with inclusive end_date semantics (+ INTERVAL '1 day')::date
-- Applied only to reserving booking statuses

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING GIST (
    equipment_id WITH =,
    daterange(start_date, (end_date + INTERVAL '1 day')::date, '[)') WITH &&
)
WHERE (status IN (
    'CONFIRMED',
    'READY_FOR_HANDOVER',
    'PICKED_UP',
    'ACTIVE',
    'RETURN_REQUESTED',
    'RETURNED'
));

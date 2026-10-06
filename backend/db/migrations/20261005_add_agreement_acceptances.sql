-- Migration: Add agreement_acceptances table
-- Core requirement PRD §7.5 (FR-AGR-01, FR-AGR-02) & TRD §7.2

CREATE TABLE IF NOT EXISTS agreement_acceptances (
    booking_id INTEGER PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
    agreement_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    accepted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

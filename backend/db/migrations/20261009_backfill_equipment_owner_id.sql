-- Backfill equipment.owner_id for legacy rows that only have a display-name/email in "owner".
-- Booking ownership now depends ONLY on owner_id (see utils/ownership.js).
-- Safe rule: assign only when the owner string matches EXACTLY ONE OWNER-role user
-- (by email, else by name). Ambiguous or unmatched rows are left NULL for manual review.

UPDATE equipment e
SET owner_id = u.id
FROM users u
WHERE e.owner_id IS NULL
  AND u.role = 'OWNER'
  AND lower(e.owner) = lower(u.email);

UPDATE equipment e
SET owner_id = m.id
FROM (
  SELECT lower(name) AS lname, MIN(id) AS id
  FROM users
  WHERE role = 'OWNER'
  GROUP BY lower(name)
  HAVING COUNT(*) = 1
) m
WHERE e.owner_id IS NULL
  AND lower(e.owner) = m.lname;

-- Review whatever is still unowned:
-- SELECT id, name, owner FROM equipment WHERE owner_id IS NULL;
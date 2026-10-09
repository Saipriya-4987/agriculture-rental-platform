/**
 * Equipment ownership check - single source of truth.
 *
 * Ownership is decided ONLY by the numeric owner_id foreign key.
 * Display names / emails are NOT unique and must never grant ownership,
 * otherwise anyone who registers with the same name as an owner could
 * act as that owner.
 */
function isEquipmentOwner(equipment, userId) {
  return Boolean(
    equipment &&
    equipment.owner_id !== null &&
    equipment.owner_id !== undefined &&
    userId !== null &&
    userId !== undefined &&
    equipment.owner_id === userId
  )
}

module.exports = { isEquipmentOwner }
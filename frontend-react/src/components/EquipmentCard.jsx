// M3 step 3 (Home page migration) + step 5 (Equipment List migration):
// reusable card component. Based on the <article class="equipment-card">
// markup shared by frontend/index.html's equipment grid and
// frontend/equipment-list.html's results grid - both pages reuse this same
// component. "View Details" is a plain <a> (no React Router yet), matching
// the original vanilla link to equipment-details.html.
//
// availabilityNote is optional: the Home page's 6 mock items don't set it
// (so nothing renders there, same as before), while the Equipment List
// page's items do (e.g. "Available from 01 Oct" / "Available now"),
// matching the <p class="availability-note"> line equipment-list.html's
// cards have but index.html's cards don't.
function EquipmentCard({ equipment }) {
  const { name, category, state, city, pricePerDay, image, imageAlt, availabilityNote } = equipment

  return (
    <article className="equipment-card">
      <img src={image} alt={imageAlt} />
      <div className="card-body">
        <span className="tag">{category}</span>
        <h3>{name}</h3>
        <p className="location">📍 {state} · {city}</p>
        <p className="price">
          ₹{pricePerDay.toLocaleString('en-IN')} <span>/ day</span>
        </p>
        {availabilityNote && <p className="availability-note">{availabilityNote}</p>}
        <a href="equipment-details.html" className="btn-view">View Details</a>
      </div>
    </article>
  )
}

export default EquipmentCard
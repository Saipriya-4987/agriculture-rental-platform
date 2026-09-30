import { Link } from 'react-router-dom'
import EquipmentImage from './EquipmentImage'

// M3 step 3 (Home page migration) + step 5 (Equipment List migration):
// reusable card component. Based on the <article class="equipment-card">
// markup shared by frontend/index.html's equipment grid and
// frontend/equipment-list.html's results grid - both pages reuse this same
// component. "View Details" is a React Router <Link> to /equipment/:id (M4 step 1).
//
// availabilityNote is optional: the Home page's 6 mock items don't set it
// (so nothing renders there, same as before), while the Equipment List
// page's items do (e.g. "Available from 01 Oct" / "Available now"),
// matching the <p class="availability-note"> line equipment-list.html's
// cards have but index.html's cards don't.
// Only the fields EquipmentCard actually reads. The data items in
// equipmentData.js carry extra filter fields (categoryValue, stateValue,
// ...), which the card ignores.
interface Equipment {
  id: number
  name: string
  category: string
  state: string
  city: string
  pricePerDay: number
  image: string
  imageAlt: string
  availabilityNote?: string
}

interface EquipmentCardProps {
  equipment: Equipment
}

function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { id, name, category, state, city, pricePerDay, image, imageAlt, availabilityNote } = equipment

  return (
    <article className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden flex flex-col">
      <EquipmentImage src={image} alt={imageAlt || name} className="w-full h-[180px] object-cover" />
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <span className="tag">{category}</span>
        <h3 className="text-[1.1rem] font-bold text-[#1f2937]">{name}</h3>
        <p className="text-[#6b7280] text-[0.9rem]">📍 {state} · {city}</p>
        <p className="text-[1.2rem] font-bold text-[#166534]">
          ₹{pricePerDay.toLocaleString('en-IN')} <span className="text-[0.85rem] font-normal text-[#6b7280]">/ day</span>
        </p>
        {availabilityNote && <p className="text-[0.8rem] text-[#166534]">{availabilityNote}</p>}
        <Link to={`/equipment/${id}`} className="btn-view mt-auto">View Details</Link>
      </div>
    </article>
  )
}

export default EquipmentCard
import type { ComponentProps, FormEvent } from 'react'
import EquipmentCard from '../components/EquipmentCard'
import { equipmentListData } from '../data/equipmentData.js'

// The card's own equipment type - every item in equipmentListData (the 6
// shared items plus the 3 list-only ones) must satisfy it, and
// availabilityNote is its optional field.
type CardEquipment = ComponentProps<typeof EquipmentCard>['equipment']

// M3 step 5: Equipment List page component.
// Based on the <section class="list-filter-bar"> + <section
// class="equipment-section"> markup in frontend/equipment-list.html.
//
// Per this step's scope, the search/filter form is static (uncontrolled,
// non-functional) - same starting point the Home page had before its own
// filtering step - and the results grid simply renders all of
// equipmentListData (the same 9 mock listings as the original page) with
// EquipmentCard, via .map().
function EquipmentList() {
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <>
      <section className="bg-green-50 border-b border-green-200 text-center py-10 pb-8">
        <div className="max-w-[1100px] mx-auto px-5">
          <h1 className="text-[1.8rem] text-green-900 mb-2">Browse Equipment</h1>
          <p className="text-gray-700 mb-6">All listed equipment. Use the filters below to narrow your search.</p>

          <form className="flex flex-wrap justify-center gap-3 max-w-[820px] mx-auto" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              name="keyword"
              placeholder="Search equipment, e.g. 'tractor'"
              aria-label="Search equipment"
              className="flex-1 min-w-[220px] px-[14px] py-3 border border-gray-300 rounded-md text-base"
            />

            <select name="category" aria-label="Filter by category" className="flex-0 min-w-[160px] px-[14px] py-3 border border-gray-300 rounded-md text-base">
              <option value="">All Categories</option>
              <option value="tractor">Tractor</option>
              <option value="harvester">Harvester</option>
              <option value="tiller">Tiller</option>
              <option value="seeder">Seeder</option>
              <option value="sprayer">Sprayer</option>
              <option value="other">Other</option>
            </select>

            <select name="state" aria-label="Filter by state" className="flex-0 min-w-[160px] px-[14px] py-3 border border-gray-300 rounded-md text-base">
              <option value="">Select your state</option>
              <option value="andhra-pradesh">Andhra Pradesh</option>
              <option value="telangana">Telangana</option>
              <option value="karnataka">Karnataka</option>
              <option value="tamil-nadu">Tamil Nadu</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="punjab">Punjab</option>
              <option value="gujarat">Gujarat</option>
              <option value="madhya-pradesh">Madhya Pradesh</option>
              <option value="uttar-pradesh">Uttar Pradesh</option>
              <option value="rajasthan">Rajasthan</option>
            </select>

            <button type="submit" className="flex-0 px-6 py-3 border-none rounded-md bg-amber-500 text-white font-bold text-base cursor-pointer hover:bg-amber-600">Search</button>

            <div className="w-full flex flex-wrap justify-center gap-7 mt-[18px]">
              <div className="flex flex-col items-start">
                <label htmlFor="list-price-min" className="text-xs font-semibold text-gray-700 mb-1.5">Price Range (&#8377;/day)</label>
                <div className="flex items-center gap-2">
                  <input type="number" id="list-price-min" name="price_min" placeholder="Min" min="0" className="px-3 py-2.5 border border-gray-300 rounded-md text-sm w-[120px]" />
                  <span className="text-gray-700">&ndash;</span>
                  <input type="number" id="list-price-max" name="price_max" placeholder="Max" min="0" className="px-3 py-2.5 border border-gray-300 rounded-md text-sm w-[120px]" />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="list-date-from" className="text-xs font-semibold text-gray-700 mb-1.5">Available From</label>
                <input type="date" id="list-date-from" name="date_from" aria-label="Available from" className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border border-gray-300 rounded-md" />
              </div>

              <div className="flex flex-col items-start">
                <label htmlFor="list-date-to" className="text-xs font-semibold text-gray-700 mb-1.5">Available Until</label>
                <input type="date" id="list-date-to" name="date_to" aria-label="Available until" className="flex-0 w-[170px] h-auto px-[14px] py-3 leading-normal border border-gray-300 rounded-md" />
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1100px] mx-auto px-5">
          <h2 className="text-[1.6rem] mb-6">{equipmentListData.length} results</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentListData.map((equipment: CardEquipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default EquipmentList
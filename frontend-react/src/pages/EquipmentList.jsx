import EquipmentCard from '../components/EquipmentCard.jsx'
import { equipmentListData } from '../data/equipmentData.js'

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
  function handleSearchSubmit(event) {
    event.preventDefault()
  }

  return (
    <>
      <section className="list-filter-bar">
        <div className="container">
          <h1>Browse Equipment</h1>
          <p className="page-subtext">All listed equipment. Use the filters below to narrow your search.</p>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              name="keyword"
              placeholder="Search equipment, e.g. 'tractor'"
              aria-label="Search equipment"
            />

            <select name="category" aria-label="Filter by category">
              <option value="">All Categories</option>
              <option value="tractor">Tractor</option>
              <option value="harvester">Harvester</option>
              <option value="tiller">Tiller</option>
              <option value="seeder">Seeder</option>
              <option value="sprayer">Sprayer</option>
              <option value="other">Other</option>
            </select>

            <select name="state" aria-label="Filter by state">
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

            <button type="submit">Search</button>

            <div className="filters-row">
              <div className="filter-group">
                <label htmlFor="list-price-min">Price Range (&#8377;/day)</label>
                <div className="range-inputs">
                  <input type="number" id="list-price-min" name="price_min" placeholder="Min" min="0" />
                  <span>&ndash;</span>
                  <input type="number" id="list-price-max" name="price_max" placeholder="Max" min="0" />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="list-date-from">Available From</label>
                <input type="date" id="list-date-from" name="date_from" aria-label="Available from" />
              </div>

              <div className="filter-group">
                <label htmlFor="list-date-to">Available Until</label>
                <input type="date" id="list-date-to" name="date_to" aria-label="Available until" />
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="equipment-section">
        <div className="container">
          <h2>{equipmentListData.length} results</h2>

          <div className="equipment-grid">
            {equipmentListData.map((equipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default EquipmentList
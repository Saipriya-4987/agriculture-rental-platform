// M3 step 3 (Home page migration) + step 4 (filtering): the same 6 mock
// equipment items used on the vanilla frontend/index.html equipment grid
// and in frontend/js/main.js's equipmentList. Kept as a plain JS array (no
// API/backend) so <Home> can filter it and render results with .map().
//
// This default export is unchanged by the M3 step 5 (Equipment List)
// migration below - <Home> keeps showing exactly these 6 items, with no
// availabilityNote field, same as before.
//
// Each item keeps its original display fields (name, category, state,
// city, pricePerDay) used by <EquipmentCard>, PLUS the slug-style filter
// fields (categoryValue/stateValue/districtValue/villageValue) and
// availabilityFrom/availabilityTo, matching the values already used by
// frontend/js/main.js's equipmentList and its state/district/village/
// category <select> option values - so filtering logic can compare with
// simple === instead of re-deriving slugs at filter time.
const equipmentData = [
  {
    id: 1,
    name: 'Mahindra 575 DI',
    category: 'Tractor',
    categoryValue: 'tractor',
    state: 'Andhra Pradesh',
    stateValue: 'andhra-pradesh',
    districtValue: 'anantapur',
    villageValue: 'anantapur',
    city: 'Anantapur',
    pricePerDay: 1200,
    availabilityFrom: '2026-10-01',
    availabilityTo: '2026-10-15',
    image: 'https://placehold.co/400x250?text=Tractor',
    imageAlt: 'Mahindra 575 DI tractor in a field',
  },
  {
    id: 2,
    name: 'John Deere S680 Combine',
    category: 'Harvester',
    categoryValue: 'harvester',
    state: 'Telangana',
    stateValue: 'telangana',
    districtValue: 'warangal',
    villageValue: 'warangal',
    city: 'Warangal',
    pricePerDay: 4500,
    availabilityFrom: '2026-10-03',
    availabilityTo: '2026-10-17',
    image: 'https://placehold.co/400x250?text=Harvester',
    imageAlt: 'Combine harvester parked near a barn',
  },
  {
    id: 3,
    name: 'Rotavator Heavy Duty 6ft',
    category: 'Tiller',
    categoryValue: 'tiller',
    state: 'Karnataka',
    stateValue: 'karnataka',
    districtValue: 'bellary',
    villageValue: 'bellary',
    city: 'Bellary',
    pricePerDay: 600,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
    image: 'https://placehold.co/400x250?text=Tiller',
    imageAlt: 'Rotary tiller attachment',
  },
  {
    id: 4,
    name: '9-Row Seed Drill',
    category: 'Seeder',
    categoryValue: 'seeder',
    state: 'Tamil Nadu',
    stateValue: 'tamil-nadu',
    districtValue: 'coimbatore',
    villageValue: 'coimbatore',
    city: 'Coimbatore',
    pricePerDay: 450,
    availabilityFrom: '2026-10-05',
    availabilityTo: '2026-10-19',
    image: 'https://placehold.co/400x250?text=Seeder',
    imageAlt: 'Seed drill machine',
  },
  {
    id: 5,
    name: 'Tractor-Mounted Boom Sprayer',
    category: 'Sprayer',
    categoryValue: 'sprayer',
    state: 'Maharashtra',
    stateValue: 'maharashtra',
    districtValue: 'nagpur',
    villageValue: 'nagpur',
    city: 'Nagpur',
    pricePerDay: 350,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
    image: 'https://placehold.co/400x250?text=Sprayer',
    imageAlt: 'Boom sprayer for pesticides',
  },
  {
    id: 6,
    name: 'Swaraj 744 FE',
    category: 'Tractor',
    categoryValue: 'tractor',
    state: 'Telangana',
    stateValue: 'telangana',
    districtValue: 'nizamabad',
    villageValue: 'nizamabad',
    city: 'Nizamabad',
    pricePerDay: 1000,
    availabilityFrom: '2026-10-08',
    availabilityTo: '2026-10-22',
    image: 'https://placehold.co/400x250?text=Tractor+2',
    imageAlt: 'Small utility tractor',
  },
]

// M3 step 4: small hardcoded demo hierarchy for the State -> District ->
// Village cascade (NOT a full India dataset) - copied from
// frontend/js/main.js's LOCATION_DATA so the same two states (Andhra
// Pradesh, Telangana) have real district/village options in React too.
// Keys match the state <select> option values used in Home.jsx.
export const locationData = {
  'andhra-pradesh': {
    anantapur: {
      label: 'Anantapur',
      villages: [
        { value: 'anantapur', label: 'Anantapur' },
        { value: 'dharmavaram', label: 'Dharmavaram' },
        { value: 'kalyandurg', label: 'Kalyandurg' },
      ],
    },
    krishna: {
      label: 'Krishna',
      villages: [
        { value: 'vijayawada', label: 'Vijayawada' },
        { value: 'gudivada', label: 'Gudivada' },
        { value: 'machilipatnam', label: 'Machilipatnam' },
      ],
    },
  },
  telangana: {
    warangal: {
      label: 'Warangal',
      villages: [
        { value: 'warangal', label: 'Warangal' },
        { value: 'hanamkonda', label: 'Hanamkonda' },
        { value: 'parkal', label: 'Parkal' },
      ],
    },
    nizamabad: {
      label: 'Nizamabad',
      villages: [
        { value: 'nizamabad', label: 'Nizamabad' },
        { value: 'bodhan', label: 'Bodhan' },
        { value: 'armoor', label: 'Armoor' },
      ],
    },
  },
}

// M3 step 5 (Equipment List migration): frontend/equipment-list.html shows
// 9 results - the same 6 items above PLUS 3 listings that only exist on
// that page - and each of its cards has an extra "Available from ..." /
// "Available now" line that the Home page's cards never had.
//
// listAvailabilityNotes holds that display text for the first 6 items,
// keyed by id, kept separate from the shared `equipmentData` items above
// so adding it doesn't change what <Home> renders (EquipmentCard only
// shows availabilityNote when the field is present).
const listAvailabilityNotes = {
  1: 'Available from 01 Oct',
  2: 'Available from 03 Oct',
  3: 'Available now',
  4: 'Available from 05 Oct',
  5: 'Available now',
  6: 'Available from 08 Oct',
}

// The 3 listings unique to frontend/equipment-list.html (ids 7-9 - not
// part of the Home page's 6 mock items at all).
const additionalListOnlyEquipment = [
  {
    id: 7,
    name: 'Disc Harrow Cultivator',
    category: 'Tiller',
    categoryValue: 'tiller',
    state: 'Karnataka',
    stateValue: 'karnataka',
    districtValue: 'raichur',
    villageValue: 'raichur',
    city: 'Raichur',
    pricePerDay: 500,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
    availabilityNote: 'Available now',
    image: 'https://placehold.co/400x250?text=Tiller+2',
    imageAlt: 'Cultivator attachment',
  },
  {
    id: 8,
    name: 'Precision Planter 4-Row',
    category: 'Seeder',
    categoryValue: 'seeder',
    state: 'Andhra Pradesh',
    stateValue: 'andhra-pradesh',
    districtValue: 'guntakal',
    villageValue: 'guntakal',
    city: 'Guntakal',
    pricePerDay: 550,
    availabilityFrom: '2026-10-12',
    availabilityTo: '2026-10-26',
    availabilityNote: 'Available from 12 Oct',
    image: 'https://placehold.co/400x250?text=Seeder+2',
    imageAlt: 'Precision planter machine',
  },
  {
    id: 9,
    name: 'Knapsack Power Sprayer',
    category: 'Sprayer',
    categoryValue: 'sprayer',
    state: 'Andhra Pradesh',
    stateValue: 'andhra-pradesh',
    districtValue: 'anantapur',
    villageValue: 'anantapur',
    city: 'Anantapur',
    pricePerDay: 200,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
    availabilityNote: 'Available now',
    image: 'https://placehold.co/400x250?text=Sprayer+2',
    imageAlt: 'Handheld motorized sprayer',
  },
]

// Full 9-item set for <EquipmentList>: the 6 shared items (each with its
// availabilityNote added on) plus the 3 list-only items above, in the same
// order as frontend/equipment-list.html's results grid.
export const equipmentListData = [
  ...equipmentData.map((item) => ({
    ...item,
    availabilityNote: listAvailabilityNotes[item.id],
  })),
  ...additionalListOnlyEquipment,
]

export default equipmentData
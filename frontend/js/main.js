// M2 step 2: hardcoded equipment data, using JS objects.
// This is the same 6 items already shown as static cards on index.html.
// Nothing reads from this array yet (no filtering/rendering) - it's just
// data, in place, ready for the next small step to use.
// Note: the HTML cards don't show an availability date yet, so
// availabilityFrom/availabilityTo below are reasonable made-up dates
// (matching the "Available from ..." notes already used on
// equipment-list.html where the same item appears there), not something
// pulled from index.html itself.
const equipmentList = [
  {
    id: 1,
    name: 'Mahindra 575 DI',
    category: 'Tractor',
    state: 'Andhra Pradesh',
    district: 'anantapur',
    village: 'anantapur',
    city: 'Anantapur',
    pricePerDay: 1200,
    availabilityFrom: '2026-10-01',
    availabilityTo: '2026-10-15',
  },
  {
    id: 2,
    name: 'John Deere S680 Combine',
    category: 'Harvester',
    state: 'Telangana',
    district: 'warangal',
    village: 'warangal',
    city: 'Warangal',
    pricePerDay: 4500,
    availabilityFrom: '2026-10-03',
    availabilityTo: '2026-10-17',
  },
  {
    id: 3,
    name: 'Rotavator Heavy Duty 6ft',
    category: 'Tiller',
    state: 'Karnataka',
    district: 'bellary',
    village: 'bellary',
    city: 'Bellary',
    pricePerDay: 600,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
  },
  {
    id: 4,
    name: '9-Row Seed Drill',
    category: 'Seeder',
    state: 'Tamil Nadu',
    district: 'coimbatore',
    village: 'coimbatore',
    city: 'Coimbatore',
    pricePerDay: 450,
    availabilityFrom: '2026-10-05',
    availabilityTo: '2026-10-19',
  },
  {
    id: 5,
    name: 'Tractor-Mounted Boom Sprayer',
    category: 'Sprayer',
    state: 'Maharashtra',
    district: 'nagpur',
    village: 'nagpur',
    city: 'Nagpur',
    pricePerDay: 350,
    availabilityFrom: '2026-09-23',
    availabilityTo: '2026-10-07',
  },
  {
    id: 6,
    name: 'Swaraj 744 FE',
    category: 'Tractor',
    state: 'Telangana',
    district: 'nizamabad',
    village: 'nizamabad',
    city: 'Nizamabad',
    pricePerDay: 1000,
    availabilityFrom: '2026-10-08',
    availabilityTo: '2026-10-22',
  },
];

// M2 location-filter step: small hardcoded demo hierarchy (NOT a full
// India dataset). Keys are the same slug-style values used by the
// state/district/village <select> options and by equipmentList's
// district/village fields, so they can be compared directly with ===.
const LOCATION_DATA = {
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
};

// M2 step 1 (FR-DSC-01) + step 3: reads the keyword input and now actually
// filters equipmentList with it (name + category, case-insensitive).
// Still no card rebuilding - just a result-count message.

// DOM selection: grab the elements we need.
const searchForm = document.getElementById('search-form');
const keywordInput = document.getElementById('search-keyword');
const searchMessage = document.getElementById('search-message');
const equipmentGrid = document.getElementById('equipment-grid');
const stateSelect = document.querySelector('select[name="state"]');
const districtSelect = document.querySelector('select[name="district"]');
const villageSelect = document.querySelector('select[name="village"]');
const categorySelect = document.querySelector('select[name="category"]');
const priceMinInput = document.getElementById('price-min');
const priceMaxInput = document.getElementById('price-max');
const dateFromInput = document.getElementById('date-from');
const dateToInput = document.getElementById('date-to');

// Turns "Andhra Pradesh" into "andhra-pradesh" so equipmentList.state
// (a display string) can be compared against the state <select>'s
// slug-style option values (also used as LOCATION_DATA's top-level keys).
function toSlug(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-');
}

// Rebuilds a <select>'s options down to just a placeholder, then appends
// one <option> per entry in `items` (each {value, label}).
function populateSelectOptions(selectEl, placeholderText, items) {
  if (!selectEl) {
    return;
  }

  selectEl.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholderText;
  selectEl.appendChild(placeholderOption);

  items.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    selectEl.appendChild(option);
  });
}

// District options depend on the selected state.
function populateDistrictOptions(stateValue) {
  const stateData = LOCATION_DATA[stateValue];
  const districtItems = stateData
    ? Object.keys(stateData).map((districtValue) => ({
        value: districtValue,
        label: stateData[districtValue].label,
      }))
    : [];

  populateSelectOptions(districtSelect, 'Select district', districtItems);
}

// Village/city options depend on the selected state AND district.
function populateVillageOptions(stateValue, districtValue) {
  const stateData = LOCATION_DATA[stateValue];
  const districtData = stateData ? stateData[districtValue] : undefined;
  const villageItems = districtData ? districtData.villages : [];

  populateSelectOptions(villageSelect, 'Select village/city', villageItems);
}

// M2 step 3 + location-filter step + category-filter step + price-filter
// step + date-filter step: filter() against name/category
// (case-insensitive), combined with state, district, village, category,
// price range and availability date range. Any level left unselected/empty
// is ignored rather than restricting results.
function filterEquipmentByKeyword(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  const selectedState = stateSelect ? stateSelect.value : '';
  const selectedDistrict = districtSelect ? districtSelect.value : '';
  const selectedVillage = villageSelect ? villageSelect.value : '';
  const selectedCategory = categorySelect ? categorySelect.value : '';

  // Empty price input = no restriction at that end. Trim first so a
  // whitespace-only value is treated the same as an empty one.
  const rawMin = priceMinInput ? priceMinInput.value.trim() : '';
  const rawMax = priceMaxInput ? priceMaxInput.value.trim() : '';
  const minPrice = rawMin === '' ? null : Number(rawMin);
  const maxPrice = rawMax === '' ? null : Number(rawMax);

  // Date inputs are already "YYYY-MM-DD", same format as
  // availabilityFrom/availabilityTo, so they compare correctly as plain
  // strings - no Date object/timezone handling needed. Empty = no
  // restriction at that end.
  const requestedFrom = dateFromInput ? dateFromInput.value : '';
  const requestedTo = dateToInput ? dateToInput.value : '';

  return equipmentList.filter((item) => {
    const nameMatches = item.name.toLowerCase().includes(lowerKeyword);
    const categoryTextMatches = item.category.toLowerCase().includes(lowerKeyword);
    const keywordMatches = nameMatches || categoryTextMatches;

    const stateMatches = selectedState === '' || toSlug(item.state) === selectedState;
    const districtMatches = selectedDistrict === '' || item.district === selectedDistrict;
    const villageMatches = selectedVillage === '' || item.village === selectedVillage;
    const categoryMatches = selectedCategory === ''
      || item.category.toLowerCase() === selectedCategory.toLowerCase();

    const minPriceMatches = minPrice === null || item.pricePerDay >= minPrice;
    const maxPriceMatches = maxPrice === null || item.pricePerDay <= maxPrice;

    // Equipment must already be available on/before the requested start
    // date, and remain available on/after the requested end date -
    // i.e. its availability window covers the requested range.
    const fromMatches = requestedFrom === '' || item.availabilityFrom <= requestedFrom;
    const toMatches = requestedTo === '' || item.availabilityTo >= requestedTo;

    return keywordMatches
      && stateMatches
      && districtMatches
      && villageMatches
      && categoryMatches
      && minPriceMatches
      && maxPriceMatches
      && fromMatches
      && toMatches;
  });
}

// M2 step 4: build one equipment-card <article>, matching the existing
// static markup/classes in index.html exactly (same structure, same
// class names), just filled in from an equipmentList item instead of
// being hand-written HTML.
function createEquipmentCard(item) {
  const card = document.createElement('article');
  card.className = 'equipment-card';

  const img = document.createElement('img');
  img.src = `https://placehold.co/400x250?text=${encodeURIComponent(item.category)}`;
  img.alt = `${item.name} (${item.category})`;
  card.appendChild(img);

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = item.category;
  cardBody.appendChild(tag);

  const title = document.createElement('h3');
  title.textContent = item.name;
  cardBody.appendChild(title);

  const location = document.createElement('p');
  location.className = 'location';
  location.textContent = `📍 ${item.state} · ${item.city}`;
  cardBody.appendChild(location);

  const price = document.createElement('p');
  price.className = 'price';
  price.append(`₹${item.pricePerDay} `);
  const perDay = document.createElement('span');
  perDay.textContent = '/ day';
  price.appendChild(perDay);
  cardBody.appendChild(price);

  const viewLink = document.createElement('a');
  viewLink.href = 'equipment-details.html';
  viewLink.className = 'btn-view';
  viewLink.textContent = 'View Details';
  cardBody.appendChild(viewLink);

  card.appendChild(cardBody);
  return card;
}

// M2 step 4: replace whatever is currently in the equipment grid with
// cards built from `matches`, or a "No equipment found" message.
function renderEquipmentCards(matches) {
  if (!equipmentGrid) {
    return;
  }

  // Clear the existing (static) cards before rendering the filtered set.
  equipmentGrid.innerHTML = '';

  if (matches.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'no-results';
    noResults.textContent = 'No equipment found';
    equipmentGrid.appendChild(noResults);
    return;
  }

  matches.forEach((item) => {
    equipmentGrid.appendChild(createEquipmentCard(item));
  });
}

// function: keeps the "what happens on submit" logic in one named place.
function handleSearchSubmit(event) {
  // Stop the form from actually navigating (action="#" would reload the page).
  event.preventDefault();

  // Reading an input value - trim so "  tractor  " and "tractor" behave the same.
  const keyword = keywordInput.value.trim();

  // A location, category, price, or date filter alone is a valid search
  // too - only block submission when there's neither a keyword NOR any
  // state/district/village/category/price/date filter set.
  const hasLocationFilter = (stateSelect && stateSelect.value !== '')
    || (districtSelect && districtSelect.value !== '')
    || (villageSelect && villageSelect.value !== '');
  const hasCategoryFilter = categorySelect && categorySelect.value !== '';
  const hasPriceFilter = (priceMinInput && priceMinInput.value.trim() !== '')
    || (priceMaxInput && priceMaxInput.value.trim() !== '');
  const hasDateFilter = (dateFromInput && dateFromInput.value !== '')
    || (dateToInput && dateToInput.value !== '');

  if (keyword === '' && !hasLocationFilter && !hasCategoryFilter && !hasPriceFilter && !hasDateFilter) {
    searchMessage.textContent = 'Please enter something to search for.';
    return;
  }

  // M2 step 3: run the filter and show a result-count message.
  const matches = filterEquipmentByKeyword(keyword);
  searchMessage.textContent = `Found ${matches.length} matching equipment`;

  // M2 step 4: render only the matching equipment cards.
  renderEquipmentCards(matches);
}

// event listener: only wire it up if the form is actually on this page.
if (searchForm) {
  searchForm.addEventListener('submit', handleSearchSubmit);
}

// Location-filter step: State -> District -> Village/City cascade.
// Changing the state repopulates districts (and clears villages, since a
// district from the old state is no longer valid); changing the district
// repopulates villages. These only update the dropdowns - filtering still
// runs solely on form submit, not on every change.
if (stateSelect) {
  stateSelect.addEventListener('change', () => {
    populateDistrictOptions(stateSelect.value);
    populateVillageOptions('', '');
  });
}

if (districtSelect) {
  districtSelect.addEventListener('change', () => {
    populateVillageOptions(stateSelect ? stateSelect.value : '', districtSelect.value);
  });
}

// =========================================================================
// M2: shared form-validation helpers, used by both the Register and Login
// pages below. Kept generic (take the form as a parameter) so both guarded
// blocks can reuse the same error-message markup/CSS (.form-message,
// .field-error) instead of duplicating it.
// =========================================================================

// How long the success message stays on screen (frontend-only "success
// flow") before Register -> login.html / Login -> index.html redirect.
// Shared by both blocks below so the two pages feel consistent.
const REDIRECT_DELAY_MS = 1200;


// Shows one message under a given field (input or fieldset) inside
// `formEl`, replacing any previous message already shown for that field.
function showFieldError(formEl, fieldEl, message) {
  clearFieldError(formEl, fieldEl);
  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  errorEl.dataset.errorFor = fieldEl.id || fieldEl.name || 'field';
  fieldEl.insertAdjacentElement('afterend', errorEl);
}

// Removes this field's error message, if one is currently shown.
function clearFieldError(formEl, fieldEl) {
  const key = fieldEl.id || fieldEl.name || 'field';
  const existing = formEl.querySelector(`.field-error[data-error-for="${key}"]`);
  if (existing) {
    existing.remove();
  }
}

// Removes every error message currently shown anywhere in the form.
function clearAllFieldErrors(formEl) {
  formEl.querySelectorAll('.field-error').forEach((el) => el.remove());
}

// =========================================================================
// M2: Register page (register.html) - client-side validation only.
// Guarded on registerForm so this block does nothing on pages (like the
// Home page) that don't have this form.
// =========================================================================
const registerForm = document.getElementById('register-form');

if (registerForm) {
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const phoneInput = document.getElementById('reg-phone');
  const passwordInput = document.getElementById('reg-password');
  const roleFieldset = registerForm.querySelector('.role-fieldset');
  const registerMessage = document.getElementById('register-message');

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Optional leading "+", then 10-15 digits - loose enough for Indian
  // mobile numbers (with or without a country code) without being strict
  // about a specific country's format.
  const PHONE_PATTERN = /^\+?\d{10,15}$/;

  function validateRegisterForm() {
    clearAllFieldErrors(registerForm);
    let isValid = true;

    if (nameInput.value.trim() === '') {
      showFieldError(registerForm, nameInput, 'Please enter your full name.');
      isValid = false;
    }

    const email = emailInput.value.trim();
    if (email === '') {
      showFieldError(registerForm, emailInput, 'Please enter your email address.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(email)) {
      showFieldError(registerForm, emailInput, 'Please enter a valid email address (e.g. you@example.com).');
      isValid = false;
    }

    const phone = phoneInput.value.trim().replace(/[\s-]/g, '');
    if (phone === '') {
      showFieldError(registerForm, phoneInput, 'Please enter your phone number.');
      isValid = false;
    } else if (!PHONE_PATTERN.test(phone)) {
      showFieldError(registerForm, phoneInput, 'Please enter a valid phone number (10-15 digits).');
      isValid = false;
    }

    if (passwordInput.value === '') {
      showFieldError(registerForm, passwordInput, 'Please enter a password.');
      isValid = false;
    }

    const roleSelected = registerForm.querySelector('input[name="role"]:checked');
    if (!roleSelected) {
      showFieldError(registerForm, roleFieldset, 'Please select whether you are a Farmer or an Owner.');
      isValid = false;
    }

    return isValid;
  }

  function handleRegisterSubmit(event) {
    // This is a frontend-only demo - never actually submit/create an account.
    event.preventDefault();

    if (!registerMessage) {
      return;
    }

    if (validateRegisterForm()) {
      registerMessage.textContent = 'Registration form is valid.';
      registerMessage.className = 'form-message success';
      // Frontend-only "success flow": no backend/account is created, so
      // just send the user on to the Login page after a short pause long
      // enough to actually read the success message.
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, REDIRECT_DELAY_MS);
    } else {
      registerMessage.textContent = 'Please fix the highlighted fields below.';
      registerMessage.className = 'form-message error';
    }
  }

  registerForm.addEventListener('submit', handleRegisterSubmit);
}

// =========================================================================
// M2: Login page (login.html) - client-side validation only.
// Guarded on loginForm so this block does nothing on pages (like the Home
// page) that don't have this form. Reuses the same showFieldError /
// clearFieldError / clearAllFieldErrors helpers and .form-message /
// .field-error CSS classes as the Register page above.
// =========================================================================
const loginForm = document.getElementById('login-form');

if (loginForm) {
  const identifierInput = document.getElementById('login-identifier');
  const loginPasswordInput = document.getElementById('login-password');
  const loginMessage = document.getElementById('login-message');

  function validateLoginForm() {
    clearAllFieldErrors(loginForm);
    let isValid = true;

    if (identifierInput.value.trim() === '') {
      showFieldError(loginForm, identifierInput, 'Please enter your email or phone number.');
      isValid = false;
    }

    if (loginPasswordInput.value === '') {
      showFieldError(loginForm, loginPasswordInput, 'Please enter your password.');
      isValid = false;
    }

    return isValid;
  }

  function handleLoginSubmit(event) {
    // This is a frontend-only demo - never actually authenticate anyone.
    event.preventDefault();

    if (!loginMessage) {
      return;
    }

    if (validateLoginForm()) {
      loginMessage.textContent = 'Login form is valid.';
      loginMessage.className = 'form-message success';
      // Frontend-only "success flow": no backend/session exists, so just
      // send the user on to the Home page after a short pause long enough
      // to actually read the success message.
      window.setTimeout(() => {
        window.location.href = 'index.html';
      }, REDIRECT_DELAY_MS);
    } else {
      loginMessage.textContent = 'Please fix the highlighted fields below.';
      loginMessage.className = 'form-message error';
    }
  }

  loginForm.addEventListener('submit', handleLoginSubmit);
}

// =========================================================================
// M2: Equipment Details page (equipment-details.html) - frontend-only
// rental/booking request form. Guarded on rentalForm so this block does
// nothing on pages that don't have it. Reuses the same showFieldError /
// clearFieldError / clearAllFieldErrors helpers and .form-message /
// .field-error CSS classes as the Register and Login blocks above - no
// real booking, payment, or backend (that's M11 scope).
// =========================================================================
const rentalForm = document.getElementById('rental-form');

if (rentalForm) {
  const rentalFromInput = document.getElementById('rental-from');
  const rentalUntilInput = document.getElementById('rental-until');
  const rentalMessage = document.getElementById('rental-message');

  function validateRentalForm() {
    clearAllFieldErrors(rentalForm);
    let isValid = true;

    if (rentalFromInput.value === '') {
      showFieldError(rentalForm, rentalFromInput, 'Please choose a rental start date.');
      isValid = false;
    }

    if (rentalUntilInput.value === '') {
      showFieldError(rentalForm, rentalUntilInput, 'Please choose a rental end date.');
      isValid = false;
    }

    // Same "YYYY-MM-DD" plain-string comparison already used for the Home
    // page's date filters (see filterEquipmentByKeyword above) - no Date
    // object/timezone handling needed. Only checked once both dates are
    // present, so this doesn't pile a second error onto an empty field.
    if (
      rentalFromInput.value !== ''
      && rentalUntilInput.value !== ''
      && rentalUntilInput.value < rentalFromInput.value
    ) {
      showFieldError(rentalForm, rentalUntilInput, 'Rental Until date cannot be earlier than Rental From date.');
      isValid = false;
    }

    return isValid;
  }

  function handleRentalSubmit(event) {
    // This is a frontend-only demo - never actually creates a booking.
    event.preventDefault();

    if (!rentalMessage) {
      return;
    }

    if (validateRentalForm()) {
      rentalMessage.textContent = 'Rental request submitted successfully.';
      rentalMessage.className = 'form-message success';
    } else {
      rentalMessage.textContent = 'Please fix the highlighted fields below.';
      rentalMessage.className = 'form-message error';
    }
  }

  rentalForm.addEventListener('submit', handleRentalSubmit);
}

// =========================================================================
// M2: Owner "List Equipment" page (equipment-new.html) - frontend-only
// listing form. Guarded on listingForm so this block does nothing on pages
// that don't have it. Reuses the same showFieldError / clearFieldError /
// clearAllFieldErrors helpers and .form-message / .field-error CSS classes
// as the Register/Login/Rental blocks above, AND reuses the page's own
// stateSelect/districtSelect/villageSelect/categorySelect (declared near
// the top of this file for the Home page's search form) - on this page
// those same querySelector('select[name="..."]') calls simply resolve to
// this form's State/District/Village/Category <select> elements instead,
// so the State -> District -> Village cascade wiring further up in this
// file (the `if (stateSelect) {...}` / `if (districtSelect) {...}` blocks)
// already works here with no extra code. No real listing is created or
// saved anywhere (that's M6+ backend work).
// =========================================================================
const listingForm = document.getElementById('listing-form');

if (listingForm) {
  const listingNameInput = document.getElementById('listing-name');
  const listingPriceInput = document.getElementById('listing-price');
  const listingDateFromInput = document.getElementById('listing-date-from');
  const listingDateUntilInput = document.getElementById('listing-date-until');
  const listingMessage = document.getElementById('listing-message');

  function validateListingForm() {
    clearAllFieldErrors(listingForm);
    let isValid = true;

    if (listingNameInput.value.trim() === '') {
      showFieldError(listingForm, listingNameInput, 'Please enter the equipment name.');
      isValid = false;
    }

    if (categorySelect && categorySelect.value === '') {
      showFieldError(listingForm, categorySelect, 'Please select a category.');
      isValid = false;
    }

    if (stateSelect && stateSelect.value === '') {
      showFieldError(listingForm, stateSelect, 'Please select a state.');
      isValid = false;
    }

    if (districtSelect && districtSelect.value === '') {
      showFieldError(listingForm, districtSelect, 'Please select a district.');
      isValid = false;
    }

    if (villageSelect && villageSelect.value === '') {
      showFieldError(listingForm, villageSelect, 'Please select a village/city.');
      isValid = false;
    }

    // Price must be present AND a valid positive number - an empty string,
    // "abc", "0" and "-50" are all rejected here, each with its own message.
    const rawPrice = listingPriceInput.value.trim();
    if (rawPrice === '') {
      showFieldError(listingForm, listingPriceInput, 'Please enter the price per day.');
      isValid = false;
    } else {
      const price = Number(rawPrice);
      if (Number.isNaN(price) || price <= 0) {
        showFieldError(listingForm, listingPriceInput, 'Please enter a valid price greater than 0.');
        isValid = false;
      }
    }

    if (listingDateFromInput.value === '') {
      showFieldError(listingForm, listingDateFromInput, 'Please choose an available-from date.');
      isValid = false;
    }

    if (listingDateUntilInput.value === '') {
      showFieldError(listingForm, listingDateUntilInput, 'Please choose an available-until date.');
      isValid = false;
    }

    // Same "YYYY-MM-DD" plain-string comparison already used for the Home
    // page's date filters and the Equipment Details rental form above - no
    // Date object/timezone handling needed. Only checked once both dates
    // are present, so this doesn't pile a second error onto an empty field.
    if (
      listingDateFromInput.value !== ''
      && listingDateUntilInput.value !== ''
      && listingDateUntilInput.value < listingDateFromInput.value
    ) {
      showFieldError(listingForm, listingDateUntilInput, 'Available Until date cannot be earlier than Available From date.');
      isValid = false;
    }

    return isValid;
  }

  function handleListingSubmit(event) {
    // This is a frontend-only demo - never actually saves a listing.
    event.preventDefault();

    if (!listingMessage) {
      return;
    }

    if (validateListingForm()) {
      listingMessage.textContent = 'Equipment listing submitted successfully.';
      listingMessage.className = 'form-message success';
    } else {
      listingMessage.textContent = 'Please fix the highlighted fields below.';
      listingMessage.className = 'form-message error';
    }
  }

  listingForm.addEventListener('submit', handleListingSubmit);
}
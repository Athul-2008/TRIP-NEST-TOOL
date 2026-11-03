// Trip Nest uses simple arrays, objects, functions, and browser storage.

const TRIPS_KEY = "tripNestTrips";
const PLACES_KEY = "tripNestPlaces";
const USER_KEY = "tripNestUser";

const startingTrips = [
  {
    id: 1,
    name: "A long weekend in Jaipur",
    destination: "Jaipur, India",
    startDate: "2026-12-18",
    endDate: "2026-12-21",
    budget: 22000,
    favorite: true,
    activities: [
      { id: 1, name: "Explore the old city", place: "Pink City", date: "2026-12-19", time: "10:00", cost: 800, notes: "Visit the market." },
      { id: 2, name: "Sunset at Nahargarh Fort", place: "Nahargarh Fort", date: "2026-12-20", time: "16:30", cost: 1200, notes: "Check the opening time." }
    ]
  },
  {
    id: 2,
    name: "Quiet days by the mountains",
    destination: "Manali, India",
    startDate: "2027-02-08",
    endDate: "2027-02-13",
    budget: 48000,
    favorite: false,
    activities: []
  }
];

const startingPlaces = [
  { id: 1, name: "Pondicherry", country: "India", favorite: true },
  { id: 2, name: "Rishikesh", country: "India", favorite: false }
];

function loadData(key, startingData) {
  const savedData = localStorage.getItem(key);
  if (savedData) {
    return JSON.parse(savedData);
  }
  return startingData;
}

let trips = loadData(TRIPS_KEY, startingTrips);
let places = loadData(PLACES_KEY, startingPlaces);
let currentUser = loadData(USER_KEY, null);
let activeTripId = null;

const tripList = document.getElementById("tripList");
const placeList = document.getElementById("placeList");
const tripDialog = document.getElementById("tripDialog");
const itineraryDialog = document.getElementById("itineraryDialog");
const accountDialog = document.getElementById("accountDialog");
const tripForm = document.getElementById("tripForm");
const activityForm = document.getElementById("activityForm");

function saveData() {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
}

function escapeHTML(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(value || "").replace(/[&<>"']/g, function (character) {
    return replacements[character];
  });
}

function formatMoney(amount) {
  return "₹" + (Number(amount) || 0).toLocaleString("en-IN");
}

function formatDate(dateText) {
  if (!dateText) {
    return "Date not set";
  }
  return new Date(dateText + "T00:00:00").toLocaleDateString("en-IN");
}

function updateSummary() {
  let totalBudget = 0;
  trips.forEach(function (trip) {
    totalBudget = totalBudget + Number(trip.budget || 0);
  });

  document.getElementById("tripCount").textContent = trips.length;
  document.getElementById("placeCount").textContent = places.length;
  document.getElementById("savedPlaceCount").textContent = places.length;
  document.getElementById("budgetTotal").textContent = formatMoney(totalBudget);
}

function renderTrips() {
  const searchText = document.getElementById("tripSearch").value.toLowerCase();
  const filterType = document.getElementById("tripFilter").value;
  const today = new Date().toISOString().slice(0, 10);

  const visibleTrips = trips.filter(function (trip) {
    const tripText = (trip.name + " " + trip.destination).toLowerCase();
    const matchesSearch = tripText.includes(searchText);
    let matchesFilter = true;

    if (filterType === "favorites") {
      matchesFilter = trip.favorite;
    }
    if (filterType === "upcoming") {
      matchesFilter = trip.endDate >= today;
    }
    return matchesSearch && matchesFilter;
  });

  if (visibleTrips.length === 0) {
    tripList.innerHTML = '<p class="empty-state">No trips found. Try another search or add a trip.</p>';
    return;
  }

  let tripHTML = "";
  visibleTrips.forEach(function (trip) {
    let activityTotal = 0;
    trip.activities.forEach(function (activity) {
      activityTotal = activityTotal + Number(activity.cost || 0);
    });

    const favoriteMark = trip.favorite ? "♥" : "♡";
    const dates = formatDate(trip.startDate) + " – " + formatDate(trip.endDate);

    tripHTML += `
      <article class="trip-card">
        <div class="trip-card-top">
          <div>
            <h3>${escapeHTML(trip.name)}</h3>
            <p class="trip-destination">${escapeHTML(trip.destination)}</p>
          </div>
          <button class="favorite-button" type="button" data-action="favorite" data-id="${trip.id}" aria-label="Toggle favorite">${favoriteMark}</button>
        </div>
        <div class="trip-meta"><span>${escapeHTML(dates)}</span><span>${trip.activities.length} activities</span></div>
        <div class="trip-budget"><span>Budget <strong>${formatMoney(trip.budget)}</strong></span><span>Activities <strong>${formatMoney(activityTotal)}</strong></span></div>
        <div class="trip-actions">
          <button class="small-action" type="button" data-action="itinerary" data-id="${trip.id}">Itinerary</button>
          <button class="small-action" type="button" data-action="edit" data-id="${trip.id}">Edit</button>
          <button class="small-action" type="button" data-action="share" data-id="${trip.id}">Share</button>
          <button class="small-action danger" type="button" data-action="delete" data-id="${trip.id}">Delete</button>
        </div>
      </article>`;
  });
  tripList.innerHTML = tripHTML;
}

function renderPlaces() {
  const searchText = document.getElementById("placeSearch").value.toLowerCase();
  const visiblePlaces = places.filter(function (place) {
    return (place.name + " " + place.country).toLowerCase().includes(searchText);
  });

  if (visiblePlaces.length === 0) {
    placeList.innerHTML = '<p class="place-empty">No saved places found.</p>';
    return;
  }

  let placeHTML = "";
  visiblePlaces.forEach(function (place) {
    const favoriteMark = place.favorite ? "♥" : "♡";
    placeHTML += `
      <article class="place-item">
        <span class="place-initial">${escapeHTML(place.name.charAt(0).toUpperCase())}</span>
        <div class="place-info"><strong>${escapeHTML(place.name)}</strong><span>${escapeHTML(place.country)}</span></div>
        <div class="place-actions">
          <button class="place-action" type="button" data-place-action="favorite" data-id="${place.id}" aria-label="Toggle favorite">${favoriteMark}</button>
          <button class="place-action" type="button" data-place-action="edit" data-id="${place.id}" aria-label="Edit place">Edit</button>
          <button class="place-action" type="button" data-place-action="delete" data-id="${place.id}" aria-label="Delete place">×</button>
        </div>
      </article>`;
  });
  placeList.innerHTML = placeHTML;
}

function renderAccount() {
  const accountButton = document.getElementById("accountButton");
  const logoutButton = document.getElementById("logoutButton");
  const helloMessage = document.getElementById("helloMessage");

  if (currentUser) {
    accountButton.textContent = currentUser.name;
    logoutButton.classList.remove("hidden");
    helloMessage.textContent = "Hello, " + currentUser.name + ". Your plans are saved in this browser.";
  } else {
    accountButton.textContent = "Log in";
    logoutButton.classList.add("hidden");
    helloMessage.textContent = "Your travel plans are saved in this browser.";
  }
}

function renderPage() {
  updateSummary();
  renderTrips();
  renderPlaces();
  renderAccount();
}

function openTripForm(trip) {
  tripForm.reset();
  document.getElementById("tripId").value = "";
  document.getElementById("tripDialogTitle").textContent = "Plan a trip";

  if (trip) {
    document.getElementById("tripId").value = trip.id;
    document.getElementById("tripDialogTitle").textContent = "Edit your trip";
    document.getElementById("tripName").value = trip.name;
    document.getElementById("tripDestination").value = trip.destination;
    document.getElementById("tripStart").value = trip.startDate;
    document.getElementById("tripEnd").value = trip.endDate;
    document.getElementById("tripBudget").value = trip.budget;
  }
  tripDialog.showModal();
}

function openItinerary(trip) {
  activeTripId = trip.id;
  document.getElementById("itineraryTitle").textContent = trip.name;
  document.getElementById("itinerarySubtitle").textContent = trip.destination + " · " + formatDate(trip.startDate) + " – " + formatDate(trip.endDate);
  resetActivityForm();
  renderActivities();
  itineraryDialog.showModal();
}

function renderActivities() {
  const trip = trips.find(function (item) {
    return item.id === activeTripId;
  });
  const activityList = document.getElementById("activityList");

  if (!trip || trip.activities.length === 0) {
    activityList.innerHTML = '<p class="empty-state">No activities yet. Add one below.</p>';
    return;
  }

  let activityHTML = "";
  trip.activities.forEach(function (activity) {
    const dateAndTime = formatDate(activity.date) + " " + activity.time;
    activityHTML += `
      <article class="activity-item">
        <div class="activity-top"><strong>${escapeHTML(activity.name)}</strong><span class="activity-cost">${formatMoney(activity.cost)}</span></div>
        <p class="activity-detail">${escapeHTML(dateAndTime)} · ${escapeHTML(activity.place)}</p>
        <p class="activity-notes">${escapeHTML(activity.notes)}</p>
        <div class="activity-actions">
          <button type="button" data-activity-action="edit" data-id="${activity.id}">Edit</button>
          <button type="button" data-activity-action="delete" data-id="${activity.id}">Delete</button>
        </div>
      </article>`;
  });
  activityList.innerHTML = activityHTML;
}

function resetActivityForm() {
  activityForm.reset();
  document.getElementById("activityId").value = "";
  document.getElementById("activityFormTitle").textContent = "Add an activity";
  document.getElementById("saveActivityButton").textContent = "Add activity";
  document.getElementById("cancelActivityEdit").classList.add("hidden");
}

function shareTrip(trip) {
  const summary = trip.name + " - " + trip.destination + ". Dates: "
    + formatDate(trip.startDate) + " to " + formatDate(trip.endDate)
    + ". Budget: " + formatMoney(trip.budget) + ".";
  window.prompt("Copy this trip summary to share it:", summary);
}

document.getElementById("addTripButton").addEventListener("click", function () {
  openTripForm(null);
});
document.getElementById("tripSearch").addEventListener("input", renderTrips);
document.getElementById("tripFilter").addEventListener("change", renderTrips);
document.getElementById("placeSearch").addEventListener("input", renderPlaces);

document.querySelectorAll("[data-close]").forEach(function (button) {
  button.addEventListener("click", function () {
    document.getElementById(button.dataset.close).close();
  });
});

tripForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const tripId = document.getElementById("tripId").value;
  const tripName = document.getElementById("tripName").value.trim();
  const destination = document.getElementById("tripDestination").value.trim();
  const startDate = document.getElementById("tripStart").value;
  const endDate = document.getElementById("tripEnd").value;
  const budget = Number(document.getElementById("tripBudget").value) || 0;

  if (endDate < startDate) {
    alert("The end date must be after the start date.");
    return;
  }

  if (tripId) {
    const trip = trips.find(function (item) {
      return item.id === Number(tripId);
    });
    trip.name = tripName;
    trip.destination = destination;
    trip.startDate = startDate;
    trip.endDate = endDate;
    trip.budget = budget;
  } else {
    trips.push({
      id: Date.now(),
      name: tripName,
      destination: destination,
      startDate: startDate,
      endDate: endDate,
      budget: budget,
      favorite: false,
      activities: []
    });
  }

  saveData();
  renderPage();
  tripDialog.close();
});

tripList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const tripId = Number(button.dataset.id);
  const trip = trips.find(function (item) {
    return item.id === tripId;
  });

  if (button.dataset.action === "favorite") {
    trip.favorite = !trip.favorite;
  } else if (button.dataset.action === "edit") {
    openTripForm(trip);
    return;
  } else if (button.dataset.action === "itinerary") {
    openItinerary(trip);
    return;
  } else if (button.dataset.action === "share") {
    shareTrip(trip);
    return;
  } else if (button.dataset.action === "delete") {
    if (!confirm("Delete this trip and its activities?")) return;
    trips = trips.filter(function (item) {
      return item.id !== tripId;
    });
  }

  saveData();
  renderPage();
});

document.getElementById("placeForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const name = document.getElementById("placeName").value.trim();
  const country = document.getElementById("placeCountry").value.trim();
  const duplicate = places.some(function (place) {
    return place.name.toLowerCase() === name.toLowerCase();
  });

  if (duplicate) {
    alert("This place is already saved.");
    return;
  }

  places.push({ id: Date.now(), name: name, country: country, favorite: false });
  event.target.reset();
  saveData();
  renderPage();
});

placeList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-place-action]");
  if (!button) return;

  const placeId = Number(button.dataset.id);
  const place = places.find(function (item) {
    return item.id === placeId;
  });

  if (button.dataset.placeAction === "favorite") {
    place.favorite = !place.favorite;
  } else if (button.dataset.placeAction === "edit") {
    const newName = prompt("Place name:", place.name);
    if (!newName) return;
    const newCountry = prompt("Country or region:", place.country);
    if (newCountry === null) return;
    place.name = newName.trim();
    place.country = newCountry.trim();
  } else if (button.dataset.placeAction === "delete") {
    if (!confirm("Delete this saved place?")) return;
    places = places.filter(function (item) {
      return item.id !== placeId;
    });
  }

  saveData();
  renderPage();
});

activityForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const trip = trips.find(function (item) {
    return item.id === activeTripId;
  });
  const activityId = document.getElementById("activityId").value;
  const name = document.getElementById("activityName").value.trim();
  const place = document.getElementById("activityPlace").value.trim();
  const date = document.getElementById("activityDate").value;
  const time = document.getElementById("activityTime").value;
  const cost = Number(document.getElementById("activityCost").value) || 0;
  const notes = document.getElementById("activityNotes").value.trim();

  if (activityId) {
    const activity = trip.activities.find(function (item) {
      return item.id === Number(activityId);
    });
    activity.name = name;
    activity.place = place;
    activity.date = date;
    activity.time = time;
    activity.cost = cost;
    activity.notes = notes;
  } else {
    trip.activities.push({
      id: Date.now(),
      name: name,
      place: place,
      date: date,
      time: time,
      cost: cost,
      notes: notes
    });
  }

  saveData();
  renderActivities();
  renderTrips();
  resetActivityForm();
});

document.getElementById("activityList").addEventListener("click", function (event) {
  const button = event.target.closest("button[data-activity-action]");
  if (!button) return;

  const trip = trips.find(function (item) {
    return item.id === activeTripId;
  });
  const activityId = Number(button.dataset.id);
  const activity = trip.activities.find(function (item) {
    return item.id === activityId;
  });

  if (button.dataset.activityAction === "edit") {
    document.getElementById("activityId").value = activity.id;
    document.getElementById("activityName").value = activity.name;
    document.getElementById("activityPlace").value = activity.place;
    document.getElementById("activityDate").value = activity.date;
    document.getElementById("activityTime").value = activity.time;
    document.getElementById("activityCost").value = activity.cost;
    document.getElementById("activityNotes").value = activity.notes;
    document.getElementById("activityFormTitle").textContent = "Edit this activity";
    document.getElementById("saveActivityButton").textContent = "Save changes";
    document.getElementById("cancelActivityEdit").classList.remove("hidden");
  } else if (button.dataset.activityAction === "delete") {
    if (!confirm("Delete this activity?")) return;
    trip.activities = trip.activities.filter(function (item) {
      return item.id !== activityId;
    });
    saveData();
    renderActivities();
    renderTrips();
  }
});

document.getElementById("cancelActivityEdit").addEventListener("click", resetActivityForm);

document.getElementById("accountButton").addEventListener("click", function () {
  accountDialog.showModal();
});
document.getElementById("loginTab").addEventListener("click", function () {
  showAccountForm("login");
});
document.getElementById("registerTab").addEventListener("click", function () {
  showAccountForm("register");
});

document.getElementById("logoutButton").addEventListener("click", function () {
  currentUser = null;
  saveData();
  renderAccount();
  accountDialog.close();
});

function showAccountForm(formName) {
  const showLogin = formName === "login";
  document.getElementById("loginForm").classList.toggle("hidden", !showLogin);
  document.getElementById("registerForm").classList.toggle("hidden", showLogin);
  document.getElementById("loginTab").classList.toggle("active", showLogin);
  document.getElementById("registerTab").classList.toggle("active", !showLogin);
}

document.getElementById("registerForm").addEventListener("submit", function (event) {
  event.preventDefault();
  currentUser = {
    name: document.getElementById("registerName").value.trim(),
    email: document.getElementById("registerEmail").value.trim()
  };
  saveData();
  renderAccount();
  accountDialog.close();
  event.target.reset();
});

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  currentUser = {
    name: email.split("@")[0].replace(/[._-]/g, " "),
    email: email
  };
  saveData();
  renderAccount();
  accountDialog.close();
  event.target.reset();
});

renderPage();

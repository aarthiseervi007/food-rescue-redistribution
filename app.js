
const STORAGE_KEY = "foodRescueListings_v1";

const sampleListings = [
  {
    id: "sample-1",
    food: "Fresh vegetable packs",
    quantity: "10 packs",
    location: "Community Centre",
    contact: "Community Kitchen",
    category: "Fruits and vegetables",
    deadline: "2030-12-31T18:00",
    notes: "Please inspect food quality before collection.",
    status: "available"
  },
  {
    id: "sample-2",
    food: "Bread and bakery items",
    quantity: "15 packs",
    location: "Main Market",
    contact: "Local Bakery",
    category: "Bakery items",
    deadline: "2030-12-31T17:00",
    notes: "Check packaging and storage conditions.",
    status: "available"
  },
  {
    id: "sample-3",
    food: "Packed vegetarian meals",
    quantity: "8 meal boxes",
    location: "College Campus",
    contact: "Student Volunteers",
    category: "Prepared meals",
    deadline: "2030-12-31T16:00",
    notes: "Confirm preparation and storage details.",
    status: "available"
  }
];

function loadListings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleListings.map(item => ({ ...item }));
  } catch {
    return sampleListings.map(item => ({ ...item }));
  }
}

let listings = loadListings();

const form = document.getElementById("donationForm");
const grid = document.getElementById("listingGrid");
const search = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const message = document.getElementById("formMessage");

function saveListings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    message.textContent = "Could not save data in this browser.";
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDeadline(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleString();
}

function renderListings() {
  const query = search.value.trim().toLowerCase();
  const filter = statusFilter.value;

  const filtered = listings.filter(item => {
    const text = [
      item.food,
      item.quantity,
      item.location,
      item.contact,
      item.category,
      item.notes
    ].join(" ").toLowerCase();

    return text.includes(query) &&
      (filter === "all" || item.status === filter);
  });

  document.getElementById("availableCount").textContent =
    listings.filter(item => item.status === "available").length;

  document.getElementById("collectedCount").textContent =
    listings.filter(item => item.status === "collected").length;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <h3>No donations found</h3>
        <p>Try another search or add a donation above.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="food-card">
      <div class="card-top">
        <span class="food-icon">🥗</span>
        <span class="status ${item.status}">
          ${item.status === "available" ? "Available" : "Collected"}
        </span>
      </div>

      <h3>${escapeHTML(item.food)}</h3>
      <p class="quantity">${escapeHTML(item.quantity)}</p>
      <p>📍 ${escapeHTML(item.location)}</p>
      <p>🗓️ ${escapeHTML(formatDeadline(item.deadline))}</p>
      <p>Category: ${escapeHTML(item.category)}</p>
      <p>Contact: ${escapeHTML(item.contact)}</p>
      ${item.notes ? `<p>${escapeHTML(item.notes)}</p>` : ""}

      <div class="card-actions">
        ${item.status === "available" ? `
          <button class="button" data-action="collect"
            data-id="${escapeHTML(item.id)}">Mark collected</button>
        ` : ""}
        <button class="button secondary" data-action="delete"
          data-id="${escapeHTML(item.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const food = document.getElementById("food").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const location = document.getElementById("location").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const deadline = document.getElementById("deadline").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value.trim();

  if (!food || !quantity || !location || !contact || !deadline) {
    message.textContent = "Please fill in all required fields.";
    return;
  }

  if (new Date(deadline).getTime() <= Date.now()) {
    message.textContent = "Choose a future availability deadline.";
    return;
  }

  listings.unshift({
    id: "donation-" + Date.now(),
    food,
    quantity,
    location,
    contact,
    deadline,
    category,
    notes,
    status: "available"
  });

  saveListings();
  form.reset();
  message.textContent = "Donation listing added successfully!";
  renderListings();
  document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
});

grid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const item = listings.find(entry => entry.id === id);

  if (!item) return;

  if (action === "collect") {
    item.status = "collected";
    saveListings();
    renderListings();
  }

  if (action === "delete") {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    listings = listings.filter(entry => entry.id !== id);
    saveListings();
    renderListings();
  }
});

search.addEventListener("input", renderListings);
statusFilter.addEventListener("change", renderListings);

renderListings();

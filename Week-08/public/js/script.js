document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop() || "index.html";

  if (page === "register.html") setupRegister();
  if (page === "login.html") setupLogin();
  if (page === "dashboard.html") setupDashboard();
});

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
}

function setupRegister() {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("message");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await postJSON("/register", data);
      msg.textContent = result.message;
      msg.style.color = "green";
      form.reset();
      setTimeout(() => location.href = "login.html", 1200);
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "crimson";
    }
  });
}

function setupLogin() {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("message");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await postJSON("/login", data);
      localStorage.setItem("busUser", JSON.stringify(result.user));
      location.href = "dashboard.html";
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "crimson";
    }
  });
}

async function setupDashboard() {
  const user = JSON.parse(localStorage.getItem("busUser") || "null");
  if (!user) {
    location.href = "login.html";
    return;
  }

  document.getElementById("userName").textContent = user.name;
  document.getElementById("passengerName").value = user.name;
  document.getElementById("passengerMobile").value = user.mobile || "";

  document.getElementById("logout").onclick = () => {
    localStorage.removeItem("busUser");
    location.href = "login.html";
  };

  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
  dateInput.value = today;

  const buses = await fetch("/api/buses").then(r => r.json());
  const fromSet = [...new Set(buses.map(b => b.from))];
  const toSet = [...new Set(buses.map(b => b.to))];
  const from = document.getElementById("from");
  const to = document.getElementById("to");

  fromSet.forEach(x => from.insertAdjacentHTML("beforeend", `<option>${x}</option>`));
  toSet.forEach(x => to.insertAdjacentHTML("beforeend", `<option>${x}</option>`));

  document.getElementById("searchBtn").onclick = () => {
    const filtered = buses.filter(b =>
      (!from.value || b.from === from.value) &&
      (!to.value || b.to === to.value)
    );
    renderBuses(filtered);
  };

  renderBuses(buses);
  loadBookings(user.id);

  let selectedBus = null;
  const modal = document.getElementById("modal");

  window.openBooking = function(id) {
    selectedBus = buses.find(b => b.id === id);
    document.getElementById("selectedBus").innerHTML =
      `<div class="booking"><b>${selectedBus.operator}</b><br>${selectedBus.from} → ${selectedBus.to}<br>${selectedBus.time} • ₹${selectedBus.price} per seat</div>`;
    document.getElementById("seatCount").value = 1;
    document.getElementById("total").textContent = selectedBus.price;
    modal.classList.remove("hidden");
  };

  document.getElementById("seatCount").oninput = e => {
    if (selectedBus) document.getElementById("total").textContent =
      selectedBus.price * Math.max(1, Number(e.target.value));
  };

  document.getElementById("closeModal").onclick = () => modal.classList.add("hidden");

  document.getElementById("bookingForm").onsubmit = async e => {
    e.preventDefault();
    const seats = Number(document.getElementById("seatCount").value);
    const data = {
      userId: user.id,
      passengerName: document.getElementById("passengerName").value,
      mobile: document.getElementById("passengerMobile").value,
      busId: selectedBus.id,
      busOperator: selectedBus.operator,
      from: selectedBus.from,
      to: selectedBus.to,
      date: dateInput.value,
      seats,
      amount: selectedBus.price * seats
    };

    try {
      const result = await postJSON("/api/bookings", data);
      document.getElementById("bookingMessage").textContent = result.message + " Booking ID: " + result.booking.id;
      document.getElementById("bookingMessage").style.color = "green";
      loadBookings(user.id);
      setTimeout(() => modal.classList.add("hidden"), 1500);
    } catch (err) {
      document.getElementById("bookingMessage").textContent = err.message;
      document.getElementById("bookingMessage").style.color = "crimson";
    }
  };

  function renderBuses(list) {
    const container = document.getElementById("busList");
    if (!list.length) {
      container.innerHTML = "<p>No buses found for the selected route.</p>";
      return;
    }
    container.innerHTML = list.map(b => `
      <div class="bus">
        <div><h3>${b.operator}</h3><div class="muted">${b.type}</div></div>
        <div><b>${b.time}</b><div class="muted">Arrival ${b.arrival}</div></div>
        <div><b>${b.from} → ${b.to}</b><div class="muted">${b.seats} seats available</div></div>
        <div><div class="price">₹${b.price}</div><button class="btn primary" onclick="openBooking(${b.id})">Book</button></div>
      </div>`).join("");
  }

  async function loadBookings(userId) {
    const list = await fetch(`/api/bookings/${userId}`).then(r => r.json());
    const box = document.getElementById("bookingList");
    box.innerHTML = list.length ? list.reverse().map(b => `
      <div class="booking">
        <b>${b.id}</b> — ${b.busOperator}<br>
        ${b.from} → ${b.to} | ${b.date}<br>
        Passenger: ${b.passengerName} | Seats: ${b.seats} | Amount: ₹${b.amount}
      </div>`).join("") : "<p>No bookings yet. Book your first journey above.</p>";
  }
}
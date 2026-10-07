const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, "users.json");
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
    return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register
app.post("/register", (req, res) => {
  const { name, age, dob, gender, email, mobile, username, password, address } = req.body;

  if (!name || !email || !mobile || !username || !password) {
    return res.status(400).json({ success: false, message: "Please fill all required fields." });
  }

  const users = readJSON(USERS_FILE);

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ success: false, message: "Username already exists." });
  }

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: "Email already registered." });
  }

  users.push({
    id: Date.now(),
    name, age, dob, gender, email, mobile, username, password, address
  });

  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: "Registration successful. You can now login." });
});

// Login
app.post("/login", (req, res) => {
  const { identifier, password } = req.body;
  const users = readJSON(USERS_FILE);

  const user = users.find(
    u => (u.username === identifier || u.email === identifier) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid username/email or password." });
  }

  res.json({
    success: true,
    message: "Login successful.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobile: user.mobile
    }
  });
});

// Get buses
app.get("/api/buses", (req, res) => {
  res.json([
    { id: 1, operator: "APSRTC Express", from: "Visakhapatnam", to: "Vijayawada", time: "06:30 AM", arrival: "01:00 PM", price: 520, seats: 18, type: "AC Seater" },
    { id: 2, operator: "Orange Travels", from: "Visakhapatnam", to: "Hyderabad", time: "08:00 PM", arrival: "07:00 AM", price: 950, seats: 12, type: "AC Sleeper" },
    { id: 3, operator: "Sri Krishna Travels", from: "Visakhapatnam", to: "Tirupati", time: "07:30 PM", arrival: "09:00 AM", price: 1100, seats: 20, type: "AC Sleeper" },
    { id: 4, operator: "Morning Star", from: "Vijayawada", to: "Visakhapatnam", time: "07:00 AM", arrival: "12:30 PM", price: 500, seats: 15, type: "Non-AC Seater" },
    { id: 5, operator: "SVKDT Travels", from: "Hyderabad", to: "Visakhapatnam", time: "09:00 PM", arrival: "08:00 AM", price: 900, seats: 10, type: "AC Sleeper" }
  ]);
});

// Create booking
app.post("/api/bookings", (req, res) => {
  const { userId, passengerName, mobile, busId, busOperator, from, to, date, seats, amount } = req.body;

  if (!userId || !passengerName || !mobile || !busId || !date || !seats || !amount) {
    return res.status(400).json({ success: false, message: "Missing booking details." });
  }

  const bookings = readJSON(BOOKINGS_FILE);
  const booking = {
    id: "BK" + Date.now(),
    userId,
    passengerName,
    mobile,
    busId,
    busOperator,
    from,
    to,
    date,
    seats,
    amount,
    bookedAt: new Date().toISOString()
  };

  bookings.push(booking);
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ success: true, message: "Bus booked successfully.", booking });
});

// User bookings
app.get("/api/bookings/:userId", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);
  res.json(bookings.filter(b => String(b.userId) === String(req.params.userId)));
});

app.listen(PORT, () => {
  console.log(`Bus Booking System running at http://localhost:${PORT}`);
});
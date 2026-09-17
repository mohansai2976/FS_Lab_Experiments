const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const usersFile = path.join(__dirname, "users.json");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Read users from JSON
function readUsers() {
  try {
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, "[]");
    }
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch (error) {
    console.error("Error reading users.json:", error);
    return [];
  }
}

// Write users to JSON
function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Registration page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Registration POST route
app.post("/register", (req, res) => {
  const { name, age, dob, gender, email, mobile, username, password, address } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).send(`
      <h2>Registration failed</h2>
      <p>Name, email, username and password are required.</p>
      <a href="/register">Go back</a>
    `);
  }

  const users = readUsers();

  const existingUser = users.find(
    user => user.username === username || user.email === email
  );

  if (existingUser) {
    return res.status(409).send(`
      <h2>Registration failed</h2>
      <p>Username or email already exists.</p>
      <a href="/register">Try again</a>
    `);
  }

  const newUser = {
    name,
    age,
    dob,
    gender,
    email,
    mobile,
    username,
    password,
    address
  };

  users.push(newUser);
  writeUsers(users);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registration Successful</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
      <div class="message-card">
        <div class="success-icon">✓</div>
        <h1>Registration Successful</h1>
        <p>Your account has been created successfully.</p>
        <a class="btn" href="/login">Go to Login</a>
      </div>
    </body>
    </html>
  `);
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Login POST route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(
    u => (u.username === username || u.email === username) &&
         u.password === password
  );

  if (!user) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Failed</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <div class="message-card">
          <div class="error-icon">!</div>
          <h1>Login Failed</h1>
          <p>Invalid username/email or password.</p>
          <a class="btn" href="/login">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
      <nav class="navbar">
        <a class="logo" href="/">BankEase</a>
        <a class="nav-link" href="/">Home</a>
        <a class="nav-link" href="/login">Logout</a>
      </nav>

      <main class="dashboard">
        <div class="dashboard-header">
          <div>
            <p class="eyebrow">ONLINE BANKING SYSTEM</p>
            <h1>Welcome, ${escapeHtml(user.name)}</h1>
            <p>Your banking dashboard is ready.</p>
          </div>
          <a class="btn secondary" href="/login">Logout</a>
        </div>

        <div class="dashboard-grid">
          <div class="dash-card">
            <span class="card-icon">₹</span>
            <h3>Account Balance</h3>
            <p class="balance">₹ 25,000.00</p>
            <small>Demo account balance</small>
          </div>

          <div class="dash-card">
            <span class="card-icon">▣</span>
            <h3>Account Holder</h3>
            <p>${escapeHtml(user.name)}</p>
            <small>${escapeHtml(user.email)}</small>
          </div>

          <div class="dash-card">
            <span class="card-icon">ID</span>
            <h3>Username</h3>
            <p>${escapeHtml(user.username)}</p>
            <small>Verified account</small>
          </div>
        </div>

        <section class="profile-box">
          <h2>Profile Information</h2>
          <div class="profile-grid">
            <p><strong>Name</strong><span>${escapeHtml(user.name)}</span></p>
            <p><strong>Age</strong><span>${escapeHtml(user.age || "Not provided")}</span></p>
            <p><strong>Date of Birth</strong><span>${escapeHtml(user.dob || "Not provided")}</span></p>
            <p><strong>Gender</strong><span>${escapeHtml(user.gender || "Not provided")}</span></p>
            <p><strong>Mobile</strong><span>${escapeHtml(user.mobile || "Not provided")}</span></p>
            <p><strong>Address</strong><span>${escapeHtml(user.address || "Not provided")}</span></p>
          </div>
        </section>
      </main>
    </body>
    </html>
  `);
});

// Prevent HTML injection when displaying stored values
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
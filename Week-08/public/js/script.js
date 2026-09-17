function validateRegistration() {
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value;

  if (mobile !== "" && !/^[0-9]{10}$/.test(mobile)) {
    alert("Mobile number must contain exactly 10 digits.");
    return false;
  }

  if (password.length < 6) {
    alert("Password must contain at least 6 characters.");
    return false;
  }

  return true;
}

function validateLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === "" || password === "") {
    alert("Please enter username/email and password.");
    return false;
  }

  return true;
}
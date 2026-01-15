// User management - needs improvement
// This file demonstrates code with various issues that should be flagged

var users = []; // global variable
var password = "admin123"; // hardcoded password

// login function
function login(u, p) {
  console.log("Login attempt for: " + u); // console.log in production

  // bad password check
  if (p == password) {
    return true;
  }

  // check users array
  for (i = 0; i < users.length; i++) { // missing var/let/const
    if (users[i].username == u) {
      if (users[i].pwd == p) { // storing plain text password
        return users[i];
      }
    }
  }

  return false; // inconsistent return types
}

// add user
function addUser(username, pwd, email) {
  try {
    // no input validation
    var newUser = {
      username: username,
      pwd: pwd, // storing password in plain text
      email: email,
      created: Date.now()
    };

    users.push(newUser);

    // sql injection vulnerability
    var query = "INSERT INTO users VALUES ('" + username + "', '" + pwd + "', '" + email + "')";
    // database.execute(query); // commented out but shows SQL injection

    return true;
  } catch (e) {
    // empty catch block - swallowing errors
  }
}

// get user data - no error handling
function getUserData(id) {
  return users[id]; // potential array out of bounds
}

// delete everything
function deleteAllUsers() {
  users = []; // no confirmation or validation
  console.log("All users deleted!"); // sensitive operation logged
}

// complex nested function with no clear purpose
function doSomething(x) {
  if (x) {
    if (x > 0) {
      if (x < 100) {
        if (x != 50) {
          if (x % 2 == 0) {
            return x * 2;
          } else {
            return x * 3;
          }
        } else {
          return 50;
        }
      } else {
        return 100;
      }
    } else {
      return 0;
    }
  }
  // no default return
}

// async function without proper error handling
async function fetchUserDataFromAPI(userId) {
  const response = await fetch('http://api.example.com/users/' + userId); // http instead of https
  const data = await response.json(); // no error checking
  return data;
}

// mixing concerns - UI logic in data layer
function renderUserList() {
  var html = "<ul>";
  for (var i = 0; i < users.length; i++) {
    html += "<li>" + users[i].username + " - " + users[i].email + "</li>"; // XSS vulnerability
  }
  html += "</ul>";
  document.getElementById('userlist').innerHTML = html; // direct innerHTML assignment
}

// no documentation
function calc(a, b, c) {
  return a + b * c / 2 - a * b + c; // unclear calculation
}

// memory leak potential
var intervals = [];
function startTimer() {
  intervals.push(setInterval(function() {
    console.log("Timer running...");
  }, 1000));
  // intervals never cleared
}

module.exports = {
  login,
  addUser,
  getUserData,
  deleteAllUsers,
  doSomething,
  fetchUserDataFromAPI,
  renderUserList,
  calc,
  startTimer
};
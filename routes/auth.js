const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Serve login form
router.get("/login", (req, res) => {
  // Serve the login page to the user
  res.sendFile("login.html", { root: "public" });
});

// Handle login submission
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).send("❌ User not found");
    }

    if (user.password !== password) {
      return res.status(401).send("❌ Incorrect password");
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role
    };

    console.log(`🔐 Logged in as ${user.username} [${user.role}]`);

    // 🔄 Redirect based on role
    if (user.role === "authority") {
      return res.redirect("/authority-dashboard");
    }  else {
      return res.redirect("/feed");
    }

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("❌ Server error during login");
  }
});


// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout Error:", err);
      return res.status(500).send("❌ Error logging out");
    }

    // After logout, redirect to the login page
    res.redirect("/login");
  });
});

module.exports = router;

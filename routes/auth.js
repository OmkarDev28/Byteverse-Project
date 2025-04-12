const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Serve login form (if you want to load it this way)
router.get("/login", (req, res) => {
  res.sendFile("login.html", { root: "public" });
});

// Handle login submission
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send("User not found");
  }

  if (user.password !== password) {
    return res.status(401).send("Incorrect password");
  }

  res.send(`Welcome, ${user.username}! Role: ${user.role}`);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

// Middleware to protect authority-only routes
function isAuthority(req, res, next) {
  if (req.session.user && req.session.user.role === "authority") {
    return next();
  } else {
    return res.status(403).send("Access denied.");
  }
}

// Authority Dashboard Route
router.get("/dashboard", isAuthority, async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();

    res.render("authority-dashboard", {
      user: req.session.user,
      stats: {
        totalPosts,
        totalUsers
      }
    });
  } catch (err) {
    console.error("Authority Dashboard Error:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

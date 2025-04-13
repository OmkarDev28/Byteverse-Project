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

// Authority Dashboard Route (GET /authority-dashboard)
router.get("/", isAuthority, async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();

    const postsByStatus = {
      pending: await Post.find({ status: "pending" }),
      inProgress: await Post.find({ status: "in_progress" }),
      approved: await Post.find({ status: "approved" }),
      declined: await Post.find({ status: "declined" })
    };

    res.render("authority-dashboard", {
      user: req.session.user,
      stats: {
        totalPosts,
        totalUsers
      },
      postsByStatus
    });
  } catch (err) {
    console.error("Authority Dashboard Error:", err);
    res.status(500).send("Server Error");
  }
});

// Show all posts to review (GET /authority/review-posts)
router.get("/review-posts", isAuthority, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("review-posts", { user: req.session.user, posts });
  } catch (err) {
    console.error("Error loading posts:", err);
    res.status(500).send("Server Error");
  }
});

// Update post status (POST /review-posts/:postId/status)
router.post("/review-posts/:postId/status", isAuthority, async (req, res) => {
  const { postId } = req.params;
  const { newStatus } = req.body;

  try {
    // Ensure status is valid before updating
    const validStatuses = ["pending", "in_progress", "approved", "declined"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send("Invalid status");
    }

    await Post.findByIdAndUpdate(postId, { status: newStatus });
    res.redirect("/authority-dashboard/review-posts"); // Redirect back to review posts page
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

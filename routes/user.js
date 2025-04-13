const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");

// Get a user's profile
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) return res.status(404).send("User not found");

    const posts = await Post.find({ author: user.username }).sort({ createdAt: -1 });

    res.render("profile", {
      username: user.username,
      title: user.title || "Newbie",
      upvotes: user.upvotesReceived || 0,
      posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;

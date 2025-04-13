const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User"); // Required for upvote author logic

// Create a new post
router.post("/post", async (req, res) => {
  const { content } = req.body;

  if (!req.session.user) {
    return res.status(401).send("You must be logged in to post");
  }

  const author = req.session.user.username;

  if (!content?.trim()) {
    return res.status(400).send("Post content can't be empty");
  }

  try {
    const post = new Post({ content, author });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating post");
  }
});

// Upvote a post
router.post("/:postId/upvote", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send("Post not found");

    post.upvotes = (post.upvotes || 0) + 1;
    await post.save();

    const author = await User.findOne({ username: post.author });
    if (author) {
      author.upvotesReceived = (author.upvotesReceived || 0) + 1;

      if (author.upvotesReceived >= 50) {
        author.title = "Influencer";
      } else if (author.upvotesReceived >= 20) {
        author.title = "Popular";
      } else if (author.upvotesReceived >= 10) {
        author.title = "Contributor";
      } else {
        author.title = "Newbie";
      }

      await author.save();
    }

    // For frontend fetch API, return JSON instead of redirect
    res.json({ upvotes: post.upvotes });
  } catch (err) {
    console.error("Upvote error:", err);
    res.status(500).send("Server error");
  }
});

// Get all posts, with optional status filtering
router.get("/posts", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status.toLowerCase() } : {};

    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts");
  }
});

// Serve the create post page
router.get("/create", (req, res) => {
  res.sendFile("createpost.html", { root: "public" });
});

module.exports = router;

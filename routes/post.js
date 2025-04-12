const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// Create a new post
router.post("/post", async (req, res) => {
  const { content, author } = req.body;

  if (!content?.trim()) {
    return res.status(400).send("Post content can't be empty");
  }
  
  if (!author?.trim()) {
    return res.status(400).send("Author name can't be empty");
  }

  try {
    const post = await Post.create({ content, author });
    res.status(201).json(post); // Returning the created post in JSON format (API style)
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating post");
  }
});

// Get all posts (API-style)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts); // Returning all posts in JSON format
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts");
  }
});

module.exports = router;

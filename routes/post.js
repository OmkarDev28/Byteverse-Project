const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// Create a new post
router.post("/post", async (req, res) => {
  const { content } = req.body;

  // Check if user is logged in (session check)
  if (!req.session.user) {
    return res.status(401).send("You must be logged in to post");
  }

  const author = req.session.user.username;

  // Ensure post content is not empty
  if (!content?.trim()) {
    return res.status(400).send("Post content can't be empty");
  }

  try {
    // Create a new post and save it to the database
    const post = new Post({
      content,
      author,
    });

    // Save the post to MongoDB
    await post.save();
    
    // Return the saved post as JSON
    res.status(201).json(post); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating post");
  }
});

// POST /post/:id/upvote
router.post("/post/:id/upvote", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Login required" });
    }
  
    const postId = req.params.id;
    const username = req.session.user.username;
  
    try {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      const alreadyUpvoted = post.upvotedBy.includes(username);
  
      if (alreadyUpvoted) {
        // User already upvoted → remove
        post.upvotedBy = post.upvotedBy.filter(user => user !== username);
        post.upvotes = Math.max(0, post.upvotes - 1);
      } else {
        // Add upvote
        post.upvotedBy.push(username);
        post.upvotes += 1;
      }
  
      await post.save();
  
      res.json({
        message: alreadyUpvoted ? "Upvote removed" : "Upvoted successfully",
        upvotes: post.upvotes,
        upvoted: !alreadyUpvoted
      });
    } catch (err) {
      console.error("Upvote error:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  });
  
  

// Get all posts (API-style)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // Get posts in descending order of creation time
    res.json(posts); // Return posts as JSON
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

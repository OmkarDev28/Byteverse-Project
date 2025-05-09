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
router.post("/:postId/upvote", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send("Post not found");

    post.upvotes = (post.upvotes || 0) + 1;
    await post.save();

    const author = await User.findById(post.author);
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

    res.redirect("back");
  } catch (err) {
    console.error("Upvote error:", err);
    res.status(500).send("Server error");
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

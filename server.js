const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();

// Import Routes
const authorityRoutes = require("./routes/authority");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error", err));

// Middleware Setup
app.use(express.static(path.join(__dirname, "public")));  // Static files like CSS, JS, images
app.use(express.urlencoded({ extended: true }));  // Parsing form data
app.use(express.json());  // Parsing JSON bodies

// Session configuration
app.use(session({
  secret: "supersecretkey",  // Change this for production
  resave: false,
  saveUninitialized: false
}));

// Route usage
app.use(authRoutes);  // Auth routes for login, etc.
app.use(postRoutes);  // Post routes for handling posts
app.use("/authority-dashboard", authorityRoutes);  // Authority routes for dashboard

// Default route (landing page)
app.get("/", (req, res) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}! <br><a href="/logout">Logout</a>`);
  } else {
    res.send('You are not logged in. <a href="/login.html">Login</a>');
  }
});

// Feed page route (for regular users)
app.get("/feed", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");  // If user is not logged in, redirect to login
  }
  res.sendFile("feed.html", { root: "public" });  // Serve the feed page
});

// Create post route (for logged-in users)
app.get("/create", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");  // If user is not logged in, redirect to login
  }
  res.sendFile("createpost.html", { root: "public" });  // Serve the create post page
});

// Authority dashboard route (only for authorities)
app.get("/authority-dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");  // If user is not logged in, redirect to login
  }

  if (req.session.user.role !== "authority") {
    return res.redirect("/feed");  // If user is not an authority, redirect to feed
  }

  // Serve the authority dashboard page
  res.sendFile("./authority-dashboard.ejs", { root: "views" });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("❌ Error during logout");
    }
    res.redirect("/");  // Redirect to home after logging out
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

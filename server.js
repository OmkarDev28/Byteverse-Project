const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error", err));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session config
app.use(session({
  secret: "supersecretkey", // Change this in production
  resave: false,
  saveUninitialized: false
}));

// Route usage
app.use(authRoutes);
app.use(postRoutes);

// Default route
app.get("/", (req, res) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}! <br><a href="/logout">Logout</a>`);
  } else {
    res.send('You are not logged in. <a href="/login.html">Login</a>');
  }
});

app.get("/feed", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");  // If the user is not logged in, redirect to login
  }
  res.sendFile("feed.html", { root: "public" });  // Serve the feed page
});

app.get("/create", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");  // If the user is not logged in, redirect to login
  }
  res.sendFile("createpost.html", { root: "public" });  // Serve the create post page
});

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

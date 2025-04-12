const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();

const app = express();

// View Engine Setup (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error", err));

// Middleware
app.use(express.static(path.join(__dirname, "public")));  // Static files (CSS, JS)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "supersecretkey",  // Replace in production
  resave: false,
  saveUninitialized: false
}));

// Routes
const authorityRoutes = require("./routes/authority");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");

app.use(authRoutes);
app.use(postRoutes);
app.use("/authority-dashboard", authorityRoutes);

// Default route
app.get("/", (req, res) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}! <br><a href="/logout">Logout</a>`);
  } else {
    res.send('You are not logged in. <a href="/login.html">Login</a>');
  }
});

// Serve register.html on GET /register
app.get("/register", (req, res) => {
  res.sendFile("register.html", { root: path.join(__dirname, "public") });
});


// Feed page
app.get("/feed", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile("feed.html", { root: "public" });
});

// Create post
app.get("/create", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile("createpost.html", { root: "public" });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("❌ Error during logout");
    res.redirect("/");
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Passport local strategy for browser login
passport.use(
  new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      if (!result.rows.length) return done(null, false, { message: "User not found" });
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });
      return done(null, { id: user.id, username: user.username });
    } catch (err) {
      return done(err);
    }
  })
);

// Browser sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT id, username FROM users WHERE id=$1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// ---------------- Register ----------------
router.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1,$2) RETURNING id, username",
      [username, hashed]
    );
    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Login ----------------
router.post("/api/login", (req, res, next) => {
  // Browser login (session)
  passport.authenticate("local", { session: true }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

    // Login for session
    req.logIn(user, (err) => {
      if (err) return next(err);

      // Issue JWT as well for mobile
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
      const refreshToken = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

      res.json({ message: "Login successful", user, token, refreshToken });
    });
  })(req, res, next);
});

// ---------------- Refresh Token ----------------
router.post("/api/token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  try {
    const user = jwt.verify(refreshToken, JWT_SECRET);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

export default router;

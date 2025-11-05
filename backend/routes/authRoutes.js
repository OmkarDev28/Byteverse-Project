import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";
import User from "../models/users.model.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


passport.use(
  new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username);

      if (error) return done(error);

      if (!users || users.length === 0)
        return done(null, false, { message: "User not found" });

      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return done(null, false, { message: "Incorrect password" });

      return done(null, { id: user.id, username: user.username });
    } catch (err) {
      return done(err);
    }
  })
);


passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", id);

    if (error) return done(error);
    if (!users || users.length === 0) return done(null, false);

    done(null, users[0]);
  } catch (err) {
    done(err, null);
  }
});


router.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ Check in Supabase
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username);

    if (existingError)
      return res.status(500).json({ message: "Database error", error: existingError.message });

    if (existing && existing.length > 0)
      return res.status(400).json({ message: "Username already exists (Supabase)" });

    // 2️⃣ Check in MongoDB as well
    const mongoExisting = await User.findOne({ username });
    if (mongoExisting)
      return res.status(400).json({ message: "Username already exists (MongoDB)" });

    // 3️⃣ Continue normally
    const hashed = await bcrypt.hash(password, 10);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ username, password: hashed }])
      .select("id, username")
      .single();

    if (insertError)
      return res.status(500).json({ message: "Insert error", error: insertError.message });

    // 4️⃣ Create Mongo profile
    await User.create({ userId: newUser.id, username: newUser.username });

    res.status(201).json({ message: "User registered", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.post("/api/login", (req, res, next) => {
  passport.authenticate("local", { session: true }, (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ message: info?.message || "Login failed" });

    req.logIn(user, (err) => {
      if (err) return next(err);

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
      const refreshToken = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

      res.json({ message: "Login successful", user, token, refreshToken });
    });
  })(req, res, next);
});


router.post("/api/token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const user = jwt.verify(refreshToken, JWT_SECRET);
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

export default router;


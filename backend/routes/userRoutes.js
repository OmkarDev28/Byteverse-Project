import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/authJWT.js"; // JWT auth for API

const router = express.Router();

// ---------------- Get Followers ----------------
router.get("/api/getfollowers/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const followersRes = await pool.query(
      `SELECT u.id, u.username, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ followers: followersRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Get Following ----------------
router.get("/api/getfollowing/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const followingRes = await pool.query(
      `SELECT u.id, u.username, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ following: followingRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/api/follow/:id", authenticateToken, async (req, res) => {
  const followerId = req.user.id;         // logged-in user
  const followingId = parseInt(req.params.id);

  if (followerId === followingId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    // Check if already following
    const exists = await pool.query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await pool.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
      [followerId, followingId]
    );

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Unfollow a user ----------------
router.post("/api/unfollow/:id", authenticateToken, async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id);

  if (followerId === followingId) {
    return res.status(400).json({ message: "You cannot unfollow yourself" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;

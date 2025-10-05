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

export default router;

import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/authJWT.js"; // JWT auth for API
import verifyAPIKey from "../middleware/verifyAPIKey.js";
import User from "../models/users.model.js";
import multer from "multer";
import mongoose from "mongoose";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

router.post("/api/upload-pfp/:userID", verifyAPIKey, upload.single("file"), async (req, res) => {
  const userID = req.params.userID;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded." });
  if (!userID) return res.status(400).json({ error: "User ID is required." });

  const ext = file.originalname.split(".").pop();
  const allowed = ["jpg", "jpeg", "png", "webp"];
  console.log(ext);
  

  try{
    
      const filename = `pfp-${userID}.jpg`;
      const filePath = `user_pfp/${filename}`;

      const { data, error } = await supabase.storage
        .from("photo_app")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
              console.error("Upload error:", error);
              return res.status(500).json({ error: "Failed to upload pfp." });
            }

      const { data: pfp_path, error: pfpPathError} = await supabase.from('user_pfp')
                                                                   .insert([{ user_id: userID, pfp_path: filePath }])
                                                                   .select('*')
      console.log(pfp_path);
      
      if (pfpPathError) {
        console.error("Error while updating path:", pfpPathError);
        return res.status(500).json({ error: "Failed to upload pfp path." });
      }

      

      
      

      return res.status(200).json({
        message: "Profile picture uploaded successfully!",
        pfpUrl: User.profilePic,
      });
    
      
 } catch (err) {
    console.error("PFP upload error:", err);
    return res.status(500).json({ error: "Internal server error." });
 }

});

router.patch("/api/update-pfp/:userID", verifyAPIKey, upload.single("file"), async (req, res) => {
  const userID = req.params.userID;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded." });
  if (!userID) return res.status(400).json({ error: "User ID is required." });

  try {
    const filename = `pfp-${userID}.jpg`;
    const filePath = `user_pfp/${filename}`;

    // 1️⃣ Upload or replace file in Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("photo_app")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // replaces if already exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload file to storage." });
    }

    // 2️⃣ Get public URL
    const { data: publicData } = supabase.storage
      .from("photo_app")
      .getPublicUrl(filePath);
    const publicUrl = publicData.publicUrl;

    // 3️⃣ Insert or update SQL table
    const { error: dbError } = await supabase
      .from("user_pfp")
      .upsert([{ user_id: userID, pfp_path: publicUrl }]); // stores the actual URL

    if (dbError) {
      console.error("DB error:", dbError);
      return res.status(500).json({ error: "Failed to update pfp path in DB." });
    }

    res.json({
      message: "Profile picture updated successfully!",
      profilePicUrl: publicUrl,
    });
  } catch (err) {
    console.error("Upload or DB update failed:", err.message);
    res.status(500).json({ error: "Profile pic update failed." });
  }
});


export default router;

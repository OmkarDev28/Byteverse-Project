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


router.get("/api/user/:userID", verifyAPIKey, async (req, res) => {
  const userID = req.params.userID;

  try {
    if (!userID) { res.status(403).json({ message: "User Id is required."});}

    const getUser = await User.find(
      { userId: userID }
    )

    if(!getUser) { res.status(404).json({ message: "User not found."});}

    res.json({
      getUser
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});
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


router.patch(
  "/api/update-user/:userID",
  verifyAPIKey,
  upload.single("file"),
  async (req, res) => {
    const userID = req.params.userID;
    const file = req.file;
    const updates = req.body;

    if (!userID) {
      return res.status(400).json({ error: "User ID is required." });
    }

    try {
      // 1️⃣ Find current user in MongoDB
      const user = await User.findOne({ userId: userID });
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      let profilePicUrl;
      let filePath;

      // 2️⃣ Handle profile picture if uploaded
      if (file) {
        // 🧹 Remove previous file if exists
        if (user.pfpPath) {
          const { error: removeError } = await supabase.storage
            .from("photo_app")
            .remove([user.pfpPath]);

          if (removeError) {
            console.warn("⚠️ Failed to remove old profile picture:", removeError.message);
          } else {
            console.log("✅ Old profile picture removed:", user.pfpPath);
          }
        }

        // 📤 Upload new file to Supabase
        const filename = `pfp-${userID}-${Date.now()}.jpg`;
        filePath = `user_pfp/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("photo_app")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error("❌ Upload error:", uploadError.message);
          return res.status(500).json({
            error: "Failed to upload profile picture.",
            details: uploadError.message,
          });
        }

        // 🌐 Get public URL of the uploaded image
        const { data: publicData } = supabase.storage
          .from("photo_app")
          .getPublicUrl(filePath);

        profilePicUrl = publicData.publicUrl;

        // Add these to updates object
        updates.profilePic = profilePicUrl;
        updates.pfpPath = filePath;
      }

      // 3️⃣ Ensure at least one field is being updated
      if (!file && Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields provided to update." });
      }

      // 4️⃣ Update MongoDB user
      const updatedUser = await User.findOneAndUpdate(
        { userId: userID },
        { $set: updates },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found during update." });
      }

      // 5️⃣ Respond to client
      res.json({
        message: file
          ? "Profile picture updated successfully!"
          : "User details updated successfully!",
        user: updatedUser,
      });
    } catch (err) {
      console.error("❌ Update failed:", err.message);
      res.status(500).json({
        error: "User update failed.",
        details: err.message,
      });
    }
  }
);



export default router;

import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/authJWT.js"; // JWT auth for API
import verifyAPIKey from "../middleware/verifyAPIKey.js";
import User from "../models/users.model.js";
import multer from "multer";
import mongoose from "mongoose";
import supabase from "../config/supabaseClient.js";
import driver from "../config/neo4jClient.js";

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
router.get("/api/getfollowers/:id", verifyAPIKey, async (req, res) => {
  const userID = Number(req.params.id);

  if (!userID) { return res.status(400).json({ message: "No user ID."});}

    try {
      const {data, error} = await supabase
        .from('followers')
        .select(
          `
          follower_id,
          users: follower_id (
            username
          )
          `
        )
        .eq('following_id', userID)
    
        if (error) throw error;

        const followers = data.map(f => ({
          id: f.follower_id,
          username: f.users.username
        }));

        return res.status(200).json({followers});
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

router.post("/api/like-unlike", verifyAPIKey, async (req, res) => {
  const userID = Number(req.body.id);
  const postID = Number(req.body.post_id);

  console.log("Incoming like request:", { userID, postID });


  if (!userID || !postID){
    return res.status(400).json({ message: "User ID or post ID is missing."});
  }

  

  try {
    const {data: existing, error: fetchError} =await supabase.from('likes').select('*').eq('user_id', userID).eq('post_id', postID).maybeSingle()

    if (fetchError) throw fetchError;

    if (existing){
      const {data: deleteLike, error: deleteLikeError} = await supabase.from('likes')
                                                                       .delete()
                                                                       .eq('user_id', userID)
                                                                       .eq('post_id', postID)
                                                                       

      
      if (deleteLikeError) throw deleteLikeError;
      return res.status(200).json({ message: "Post unliked successfully." });
    }
    else {
      const {data: addLike, error: addLikeError} = await supabase.from('likes').insert([{
                                                                                user_id: userID,
                                                                                post_id: postID
                                                                            }])
      
      if (addLikeError) throw addLikeError;                                                                      
      return res.status(200).json({message: "Post liked successfully."});
    }

    

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});




// ---------------- Get Following ----------------
router.get("/api/getfollowing/:id", verifyAPIKey, async (req, res) => {
  const userID = Number(req.params.id);

  try {
    const {data, error} = await supabase
      .from('followers')
      .select(`
        following_id,
        users: following_id (
          username

        )
        `)
      .eq('follower_id', userID)

      if (error) throw error;

      const following = data.map(f => ({
        id: f.following_id,
        username: f.users.username
      }));

      return res.status(200).json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/api/follow-unfollow/:user_id", verifyAPIKey, async (req, res) => {
  const followerId = Number(req.body.id);         
  const followingId = Number(req.params.user_id);

  
  

  if (followerId === followingId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const {data: existingFollower, error: existingFollowerError} = await supabase.from('followers')
                                                                                 .select("*")
                                                                                 .eq('follower_id', followerId)
                                                                                 .eq('following_id', followingId)
                                                                                 .maybeSingle()

    if (existingFollowerError) throw existingFollowerError;
    
    if (existingFollower){ 
      const {data: removeFollower, error: removeFollowerError} = await supabase.from('followers')
                                                                               .delete()
                                                                               .eq('follower_id', followerId)
                                                                               .eq('following_id', followingId)

      if (existingFollowerError) throw existingFollowerError;
      return res.status(200).json({ message: "Unfollowed successfully."});                                                                        
    }
    else {
      const {data: addFollower, error: addFollowerError} = await supabase.from('followers')
                                                                         .insert([{'follower_id': followerId, 'following_id': followingId}])

      if (addFollowerError) throw addFollowerError;
      return res.status(200).json({ message: "Followed successfully."});                                                                      
    }
    
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
        // 🧹 Remove previous file from Supabase (if exists)
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

        // 🌐 Get public URL
        const { data: publicData } = supabase.storage
          .from("photo_app")
          .getPublicUrl(filePath);

        profilePicUrl = publicData.publicUrl;

        updates.profilePic = profilePicUrl;
        updates.pfpPath = filePath;
      }

      // 3️⃣ Check if anything to update
      if (!file && Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields provided to update." });
      }

      // 4️⃣ Update MongoDB
      const updatedUser = await User.findOneAndUpdate(
        { userId: userID },
        { $set: updates },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found during update." });
      }

      try {
        const {date, error} = await supabase
          .from('users')
          .update([{pfpPath: updates.pfpPath, ProfilePic: updates.profilePic}])
          .eq('id', userID)

        if ( error ) throw error;
      
      } catch (neoErr) {
        console.error("⚠️ Failed to update Neo4j:", neoErr.message);
      }

      // 6️⃣ Final response
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

router.post("/api/follow", verifyAPIKey, async (req, res) => {
  try {
    let { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: "Both followerId and followingId are required." });
    }

    followerId = String(followerId);
    followingId = String(followingId);

    if (followerId === followingId) {
      return res.status(400).json({ error: "You cannot follow yourself." });
    }

    const session = driver.session();

    const result = await session.run(
      `
        MERGE (a:User {id: $followerId})
        MERGE (b:User {id: $followingId})
        MERGE (a)-[:FOLLOWS]->(b)
        RETURN a, b
      `,
      { followerId, followingId }
    );

    await session.close();

    return res.json({ message: `User ${followerId} now follows ${followingId}.` });

  } catch (error) {
    console.error("Neo4j follow error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/api/unfollow", verifyAPIKey, async (req, res) => {
  const { followerId, followingId } = req.body;

  if (!followerId || !followingId) {
    return res.status(400).json({ error: "Missing followerId or followingId" });
  }

  

  const session = driver.session();

  try {
    const result = await session.run(
      `
        MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followingId})
        DELETE r
        RETURN COUNT(r) AS deletedCount
      `,
      { followerId, followingId }
    );

    const deletedCount = result.records[0].get("deletedCount").toNumber();

    if (deletedCount === 0) {
      return res.status(404).json({ message: "No follow relationship found." });
    }

    res.json({ message: "Unfollowed successfully." });
  } catch (error) {
    console.error("Neo4j error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
});




export default router;

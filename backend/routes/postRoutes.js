import express from "express";
import multer from "multer";
import crypto from "crypto";
import supabase from "../config/supabaseClient.js";
import verifyAPIKey from "../middleware/verifyAPIKey.js";
import driver from "../config/neo4jClient.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/api/upload-post", verifyAPIKey, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.body.id;
    const postCaption = req.body.caption;

    // caption must be present
    if (!postCaption || postCaption.trim() === "")
      return res.status(400).json({ error: "Caption is required." });

    if (!userId)
      return res.status(400).json({ error: "User ID is required." });

    let filePath = null;
    let publicUrl = null;

    // If file exists, upload it
    if (file) {
      const ext = file.originalname.split(".").pop();
      const randomHex = crypto.randomBytes(16).toString("hex");
      const filename = `${randomHex}.${ext}`;
      filePath = `user_posts/${userId}/${filename}`;

      const { data, error } = await supabase.storage
        .from("photo_app")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: "Failed to upload file." });
      }

      // ✅ fix: match the same bucket name here ("photo_app")
      const { data: publicUrlData } = supabase.storage
        .from("photo_app")
        .getPublicUrl(filePath);

      publicUrl = publicUrlData.publicUrl;
    }

    // Insert post record (works for both text-only and photo posts)
    const { error: insertError } = await supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          caption: postCaption,
          post_path: filePath,
          postPhotoUrl: publicUrl,
        },
      ]);

    if (insertError) {
      console.error("Database insert error:", insertError);
      return res.status(500).json({ error: "Failed to save post record." });
    }

    res.json({
      message: "Post uploaded successfully.",
      photoIncluded: !!file,
      caption: postCaption,
      filePath,
      publicUrl,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});


router.put("/api/edit-post/:postID", verifyAPIKey, async (req, res) => {
  const postId = req.params.postID;
  const { id: userID, updatedPostCaption } = req.body;

  

  try {
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("post_id", postId)
      .single();

      console.log("userId from request:", typeof(req.body.id));
 console.log("post owner in db:", typeof(post.user_id));

    if (fetchError) throw fetchError;
    if (!post || post.user_id !== Number(userID)) {
      return res.status(403).json({ message: "You can edit only your posts." });
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({ caption: updatedPostCaption })
      .eq("post_id", postId)
      .select("*");

    if (updateError) throw updateError;

    res.json({ message: "Post updated successfully", updatedPost });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});




// GET /api/posts/recent?limit=5&offset=0
router.get("/api/posts/recent", verifyAPIKey, async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 5;
    let offset = parseInt(req.query.offset) || 0;

    // 1️⃣ Fetch posts from Supabase
    const { data: posts, error } = await supabase
      .from("posts")
      .select("post_id, user_id, caption, post_path, postPhotoUrl, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ message: "Failed to fetch posts." });
    }

    const session = driver.session();
    const postIDs = posts.map(p => String(p.post_id));
    const result = await session.run(
      `
      UNWIND $postIDs AS pid
      MATCH (p:Post {post_id: pid})
      OPTIONAL MATCH (u:User)-[:LIKES]->(p)
      RETURN p.post_id AS post_id, COUNT(u) AS likesCount
      `,
      { postIDs }
    );

    const likesMap = {};
    result.records.forEach(rec => {
      likesMap[rec.get("post_id")] = rec.get("likesCount").toNumber();
    });

    const postsWithLikes = posts.map(p => ({
      ...p,
      likesCount: likesMap[String(p.post_id)] || 0
    }));
    await session.close();

    res.json({
      message: "Recent posts fetched successfully.",
      posts: postsWithLikes,
      limit,
      offset,
      nextOffset: offset + postsWithLikes.length
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});



export default router;

import express from "express";
import multer from "multer";
import crypto from "crypto";
import supabase from "../config/supabaseClient.js";
import verifyAPIKey from "../middleware/verifyAPIKey.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/api/upload-post", verifyAPIKey, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.body.id; 
    const postCaption = req.body.caption;

    if (!file) return res.status(400).json({ error: "No file uploaded." });
    if (!userId) return res.status(400).json({ error: "User ID is required." });

    
    const ext = file.originalname.split(".").pop();
    const randomHex = crypto.randomBytes(16).toString("hex");
    const filename = `${randomHex}.${ext}`;

    
    const filePath = `user_posts/${userId}/${filename}`;

    
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

    
    const { data: publicUrlData } = supabase.storage
      .from("photo-app")
      .getPublicUrl(filePath);

    const { data: insertPost} = await supabase
                                    .from('posts')
                                    .insert([{ post_path: filePath, user_id: userId, caption: postCaption}])


    res.json({
      message: "File uploaded successfully.",
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.put('/api/edit-post/:postID', verifyAPIKey, async (req, res) => {
  const postId = req.params.postID;
  const userID = req.body.id;
  const updatedPostCaption = req.body.updatedPostCaption;

  try {
    const {data: validUser, error: validUserError} = await supabase.from('posts')
                                                                   .select('post_id, user_id')
                                                                   .eq('post_id', postId)
                                                                   
                                                                   

    if (validUser.length == 0){
      return res.status(400).json({ message: "You can edit only your posts."});
    }             
    
    const {data: updatedPostData, error: UpdatedPostError} = await supabase.from('posts')
                                                                           .update({caption: updatedPostCaption})
                                                                           .eq('post_id', postId)
                                                                           .select('*')
    
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
})



export default router;

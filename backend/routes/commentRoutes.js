import express from "express";
import verifyAPIKey from "../middleware/verifyAPIKey.js";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

router.post("/api/add-comment/:postId", verifyAPIKey, async (req, res) => {
    const postId = req.params.postId;
    const commentText = req.body.commentText;
    const userId = req.body.id;

    try{
        if (!postId){ return res.status(400).json({ message: 'post ID is required'});}
        if (!commentText){ return res.status(400).json({ message: 'comment text is required'});}

        const { data: uploadComment, error} = await supabase.from('comments').insert([{
                                                                                        post_id: postId,
                                                                                        user_id: userId,
                                                                                        comment_text: commentText,

                                                                                    }]);

        if (error) {
            console.error("Comment error", error );
            return res.status(500).json({message: "Error while posting comment."});
        }  

    } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error." });
  }          

  
  res.json({ message: "Comment added" });
});

router.delete("/api/delete-comment/:commentID", verifyAPIKey, async (req, res) => {
    const commentID = req.params.commentID;

    try{
        if(!commentID){ res.status(400).json({message: "Comment ID is required to delete comment."});}

        const {data: deleteComment, error} = await supabase.from('comments').delete().eq('comment_id', commentID);

        if (error) {
        console.error("Error while deleting comment.", error);
        return res.status(500).json({ error: "Failed to delete comment." });
        }

        res.json({
           message: "Comment deleted successfully.",
        });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

router.put("/api/edit-comment/:commentID", verifyAPIKey, async (req, res) => {
    console.log('working');
    
    const commentID = req.params.commentID;
    const updatedComment = req.body.updatedCommentText;

    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("comment_id", commentID)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingComment) {
      return res.status(404).json({ message: "Comment not found or not yours." });
    }  

    try {
        if (!commentID) { return res.status(400).json({ message: "Comment ID is required to edit comment."});}

        const {data: editComment, error} = await supabase
                                                    .from('comments')
                                                    .update({ comment_text: updatedComment})
                                                    .eq('comment_id', commentID)
                                                    .select('*')

        if (error) {
            console.error("Comment editing error", error );
            return res.status(500).json({message: "Error while editing comment."});
        } 

        return res.status(200).json({
        message: "Comment updated successfully.",
        updated: editComment[0],
        });

    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
});

export default router;
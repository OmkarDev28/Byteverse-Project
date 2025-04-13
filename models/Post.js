const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, default: "Anonymous" },
  image: { type: Buffer },
  imageType: { type: String },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  status: {
    type: String,
    enum: ["pending", "in_progress", "approved", "declined"],
    default: "pending"
  }
});

module.exports = mongoose.model("Post", postSchema);


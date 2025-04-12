const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, default: "Anonymous" },
  image: { type: Buffer }, // This will store the actual image data (binary)
  imageType: { type: String }, // Store the image's MIME type (e.g., image/jpeg)
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
});

module.exports = mongoose.model("Post", postSchema);


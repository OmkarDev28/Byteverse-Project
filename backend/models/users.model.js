import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "Hey there! I'm here to make a difference.",
    },

    
    issuesReported: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    issuesResolved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    totalUpvotes: {
      type: Number,
      default: 0,
    },

    
    settings: {
      theme: { type: String, default: "light" },
      notifications: { type: Boolean, default: true },
      locationVisible: { type: Boolean, default: false },
    },

    
    profilePic: {
      type: String,
      default: "",
    },

    
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema, "user_data");

export default User;

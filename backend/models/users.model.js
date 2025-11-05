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
      required: false,
      trim: true,
    },

    profilePic: {
      type: String, 
      default: "",
    },

    pfpPath: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "Hey there! I'm here to make a difference.",
    },

    
    issuesReported: [
      {
        type: String,
        ref: "Issue",
      },
    ],

    issuesResolved: [
      {
        type: String,
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

    
    
    
  },
  { timestamps: true }
);

const User = mongoose.model("user_data", userSchema, "user_data");

export default User;

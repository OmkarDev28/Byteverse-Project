// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Database.");
  } catch (err) {
    console.error("❌ Error while connecting to MongoDB:", err.message);
    process.exit(1); // Exit process if DB fails
  }
};

export default connectDB;

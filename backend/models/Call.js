import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["audio", "video"],
    required: true
  },
  status: {
    type: String,
    enum: ["missed", "completed"],
    default: "completed"
  },
  duration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ FIX: Use "Call", NOT "Message"
export default mongoose.model("Call", callSchema);
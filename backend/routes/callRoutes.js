import express from "express";
import Call from "../models/Call.js";

const router = express.Router();


// ✅ SAVE CALL
router.post("/save-call", async (req, res) => {
  try {
    const { from, to, type, duration, status } = req.body;

    // 🔥 VALIDATION
    if (!from || !to || !type) {
      return res.status(400).json({
        message: "Missing required fields (from, to, type)"
      });
    }

    const call = await Call.create({
      from,
      to,
      type, // "audio" or "video"
      status: status || "completed", // "missed", "completed"
      duration: duration || 0,
      createdAt: new Date()
    });

    res.status(201).json(call);

  } catch (err) {
    console.error("❌ Save Call Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ GET CALL HISTORY (WITH USER DETAILS)
router.get("/calls/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    })
      // 🔥 Populate user info
      .populate("from", "fullName profilePic")
      .populate("to", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(calls);

  } catch (err) {
    console.error("❌ Fetch Calls Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ DELETE ALL CALLS (optional feature)
router.delete("/calls/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Call.deleteMany({
      $or: [
        { from: userId },
        { to: userId }
      ]
    });

    res.json({ message: "Call history cleared" });

  } catch (err) {
    console.error("❌ Delete Calls Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
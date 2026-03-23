import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// ✅ Get users + unseen message count
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const filteredUser = await User.find({
      _id: { $ne: userId },
    }).select("-password");

    const unseenMessages = {};

    const promises = filteredUser.map(async (user) => {
      const count = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (count > 0) {
        unseenMessages[user._id] = count;
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      users: filteredUser,
      unseenMessages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // ✅ Mark messages as seen
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
        seen: false,
      },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Mark single message as seen (optional)
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    await Message.findByIdAndUpdate(id, { seen: true });

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Send message (text or image)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;

    // ✅ Upload image if exists
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // ✅ Create message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      seen: false, // IMPORTANT
    });

    // ✅ Real-time socket emit
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
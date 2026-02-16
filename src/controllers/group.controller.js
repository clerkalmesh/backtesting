import GroupMessage from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getGlobalMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGlobalMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGlobalMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user._id;
    const senderName = req.user.displayName || "Anonymous";
    const senderAnonymousId = req.user.anonymousId;
    const senderProfilePic = req.user.profilePic || "";

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new GroupMessage({
      senderId,
      senderName,
      senderAnonymousId,
      senderProfilePic,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    // Emit via socket (pastikan io sudah disimpan di app)
    const io = req.app.get("io");
    if (io) {
      io.to("global").emit("newGlobalMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGlobalMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

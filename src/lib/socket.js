import { Server } from "socket.io";
import http from "http";
import express from "express";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://nymousechat.vercel.app",
    credentials: true,
  },
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (userId) => userSocketMap[userId];

// Middleware autentikasi socket
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error("Authentication error: No cookies"));
    }

    const parsed = cookie.parse(cookies);
    const token = parsed.jwt;
    if (!token) {
      return next(new Error("Authentication error: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-secretHash");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id, "userId:", socket.userId);

  userSocketMap[socket.userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
    // 🔥 Join room global
  socket.join("global");
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 📨 Event: kirim pesan global
  socket.on("sendGlobalMessage", async (data) => {
    try {
      const { text, image } = data;
      const senderId = socket.userId;
      const senderName = socket.userName;

      // Simpan ke database
      const newMessage = new GroupMessage({
        senderId,
        senderName,
        text,
        image,
      });
      await newMessage.save();

      // Broadcast ke semua user di room global
      io.to("global").emit("newGlobalMessage", newMessage);
    } catch (error) {
      console.error("Error sending global message:", error);
      socket.emit("error", "Gagal mengirim pesan global");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[socket.userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
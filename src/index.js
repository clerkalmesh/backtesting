import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import groupRoute from "./routes/group.route.js";
import connectDB from "./config/database.js";
import { app, server } from "./lib/socket.js";

const port = process.env.PORT;

// Middleware
app.use(express.json({ limit: "10mb"}));
app.use(cookieParser());
app.use(cors({
  origin: 'https://nymousechat.vercel.app', 
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/messages", messageRoute);
app.use("/api/global", groupRoute);

// 
async function main() {
    try {
        await connectDB();
        server.listen(port, () => console.log("server running in port " + port));
    } catch (error) {
        console.log(`error running in server ${error}`);
    }
}

main()

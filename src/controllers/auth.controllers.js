import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateSecretKey, generateAnonymousId } from "../utils/identity.js";
import cloudinary from "../lib/cloudinary.js";

// SIGNUP → generate secretKey & anonymousId unik
export const signup = async (req, res) => {
  try {
    const secretKey = generateSecretKey();

    let anonymousId;
    let exists = true;
    while (exists) {
      anonymousId = generateAnonymousId();
      exists = await User.findOne({ anonymousId });
    }

    const salt = await bcrypt.genSalt(10);
    const secretHash = await bcrypt.hash(secretKey, salt);

    const newUser = new User({ anonymousId, secretHash });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    // Saat login dan signup
res.cookie('jwt', token, {
  httpOnly: true,
  secure: true,                          // wajib true karena HTTPS di Railway
  sameSite: 'none',                       // izinkan cross-origin (Vercel → Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

    res.status(201).json({
      _id: newUser._id,
      anonymousId: newUser.anonymousId,
      displayName: newUser.displayName,
      profilePic: newUser.profilePic,
      secretKey,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login - validasi secretKey
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({ message: 'Secret key wajib diisi' });
    }

    // Cari user berdasarkan secretHash (dengan iterasi semua user - hanya untuk demo)
    const users = await User.find({});
    let foundUser = null;
    for (const user of users) {
      const match = await bcrypt.compare(secretKey, user.secretHash);
      if (match) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ message: 'Secret key tidak valid' });
    }

    // Buat token baru
    const token = jwt.sign({ userId: foundUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Saat login dan signup
res.cookie('jwt', token, {
  httpOnly: true,
  secure: true,                          // wajib true karena HTTPS di Railway
  sameSite: 'none',                       // izinkan cross-origin (Vercel → Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

    res.json({
      _id: foundUser._id,
      anonymousId: foundUser.anonymousId,
      displayName: foundUser.displayName,
      profilePic: foundUser.profilePic,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout - hapus cookie
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
};

// @desc    Check auth - ambil user dari token
// @route   GET /api/auth/check
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-secretHash');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Update profile picture
// @route   PUT /api/auth/update-profile-pic
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Upload ke cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select('-secretHash');

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

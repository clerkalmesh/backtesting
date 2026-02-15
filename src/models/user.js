import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  anonymousId: {
    type: String,
    required: true,
    unique: true,
  },
  secretHash: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    default: 'Anonymous',
  },
  profilePic: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
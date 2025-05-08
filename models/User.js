const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Made optional since not all versions included it
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['athlete', 'coach', 'admin', 'user'],
    default: 'athlete',
  },
  userType: {
    type: String,
    enum: ['athlete', 'user'],
    required: true,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

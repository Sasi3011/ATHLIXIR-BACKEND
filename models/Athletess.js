const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  sport: {
    type: String,
    trim: true
  },
  team: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  country: {
    type: String,
    trim: true
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String,
    website: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

const Athlete = mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;
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
  }
}, { 
  timestamps: true 
});

const Athlete = mongoose.models.Athlete || mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;

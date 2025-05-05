const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  sportsCategory: { type: String, required: true },
  biography: { type: String, required: true },
  yearsOfExperience: { type: Number, required: true, min: 0 },
  athleteType: { type: String, enum: ['athlete', 'para-athlete'], required: true },
  languagesSpoken: { type: String, required: true },
  medalsAndAwards: { type: String },
  competingSince: { type: Date, required: true },
  goals: { type: String, required: true },
  profilePhoto: { type: String }, // Base64 string
  skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'professional'] }, // Added skillLevel
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Athlete', athleteSchema);
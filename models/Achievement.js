const mongoose = require('mongoose');

const performanceDetailSchema = new mongoose.Schema({
  label: {
    type: String,
    required: false
  },
  value: {
    type: String,
    required: false
  }
});

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  event: {
    type: String,
    required: true,
    trim: true
  },
  medalType: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'state', 'national', 'personal'],
    default: 'gold'
  },
  date: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: function() {
      return this.date;
    }
  },
  endDate: {
    type: Date,
    default: function() {
      return this.date;
    }
  },
  description: {
    type: String,
    trim: true
  },
  isCareerHighlight: {
    type: Boolean,
    default: false
  },
  isPersonalBest: {
    type: Boolean,
    default: false
  },
  performanceDetails: {
    type: [performanceDetailSchema],
    default: []
  },
  performanceList: {
    type: [String],
    default: []
  },
  athleteEmail: {
    type: String,
    required: true,
    trim: true
  },
  athleteImage: {
    type: String
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

// Add index for faster queries
achievementSchema.index({ athleteEmail: 1 });
achievementSchema.index({ date: -1 });
achievementSchema.index({ isCareerHighlight: 1 });
achievementSchema.index({ isPersonalBest: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
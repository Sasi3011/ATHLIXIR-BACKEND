const express = require('express');
const router = express.Router();
const Athlete = require('../models/athlete');
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 300 });

// @route   GET /api/athletes/profile
// @desc    Get current athlete profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ email: req.user.email }).lean();
    
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete profile not found' });
    }

    res.json(athlete);
  } catch (err) {
    console.error('Error in fetching athlete profile:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/athletes/profile/:email
// @desc    Get athlete profile by email
// @access  Private
router.get('/profile/:email', auth, async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ email: req.params.email }).lean();
    
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete profile not found' });
    }

    res.json(athlete);
  } catch (err) {
    console.error('Error in fetching athlete profile by email:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/athletes/profile
// @desc    Create or update athlete profile
// @access  Private
router.post('/profile', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    profileImage,
    sport,
    team,
    bio,
    dateOfBirth,
    country,
    socialLinks
  } = req.body;

  // Build athlete profile object
  const athleteFields = {
    email: req.user.email,
    name,
    updatedAt: Date.now()
  };

  if (profileImage) athleteFields.profileImage = profileImage;
  if (sport) athleteFields.sport = sport;
  if (team) athleteFields.team = team;
  if (bio) athleteFields.bio = bio;
  if (dateOfBirth) athleteFields.dateOfBirth = new Date(dateOfBirth);
  if (country) athleteFields.country = country;
  if (socialLinks) athleteFields.socialLinks = socialLinks;

  try {
    let athlete = await Athlete.findOne({ email: req.user.email });

    if (athlete) {
      // Update existing profile
      athlete = await Athlete.findOneAndUpdate(
        { email: req.user.email },
        { $set: athleteFields },
        { new: true }
      );
      return res.json(athlete);
    }

    // Create new profile
    athlete = new Athlete(athleteFields);
    await athlete.save();
    res.json(athlete);
  } catch (err) {
    console.error('Error in updating athlete profile:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/athletes/stats
// @desc    Get athlete statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  const cacheKey = `stats-${req.user.email}`;
  const cachedStats = statsCache.get(cacheKey);
  
  if (cachedStats) {
    return res.json(cachedStats);
  }
  
  try {
    // Existing stats calculation code
    const achievements = await Achievement.find({ athleteEmail: req.user.email });
    
    const stats = {
      totalAchievements: achievements.length,
      goldMedals: achievements.filter(a => a.medalType === 'gold').length,
      silverMedals: achievements.filter(a => a.medalType === 'silver').length,
      bronzeMedals: achievements.filter(a => a.medalType === 'bronze').length,
      careerHighlights: achievements.filter(a => a.isCareerHighlight).length,
      personalBests: achievements.filter(a => a.isPersonalBest).length
    };
    
    statsCache.set(cacheKey, stats);
    res.json(stats);
  } catch (err) {
    console.error('Error in fetching athlete stats:', err.message);
    res.status(500).send('Server error');
  }
});
module.exports = router;
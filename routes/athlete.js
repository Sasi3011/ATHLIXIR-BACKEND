const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Athlete = require('../models/athlete');
const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation rules for athlete profile
const profileValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('address').notEmpty().withMessage('Address is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('nationality').notEmpty().withMessage('Nationality is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('sportsCategory').notEmpty().withMessage('Sports category is required'),
  body('biography').notEmpty().withMessage('Biography is required'),
  body('yearsOfExperience').isInt({ min: 0 }).withMessage('Years of experience must be a non-negative number'),
  body('athleteType').isIn(['athlete', 'para-athlete']).withMessage('Invalid athlete type'),
  body('languagesSpoken').notEmpty().withMessage('Languages spoken is required'),
  body('competingSince').notEmpty().withMessage('Competing since date is required'),
  body('goals').notEmpty().withMessage('Goals are required'),
];

// Save athlete profile
router.post(
  '/profile',
  authMiddleware,
  profileValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profileData = req.body;
      if (req.user.email !== profileData.email) {
        return res.status(403).json({ error: 'Unauthorized email' });
      }

      const athlete = await Athlete.findOneAndUpdate(
        { email: profileData.email },
        { ...profileData, userId: req.user.id, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      // Update user profile completion
      await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });

      res.json({ success: true, athlete });
    } catch (err) {
      console.error('Save profile error:', err.message);
      next(err);
    }
  }
);

// Get athlete profile
router.get(
  '/profile/:email',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { email } = req.params;
      if (req.user.email !== email) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      const athlete = await Athlete.findOne({ email });
      if (!athlete) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(athlete);
    } catch (err) {
      console.error('Get profile error:', err.message);
      next(err);
    }
  }
);

// Update athlete profile
router.put(
  '/profile',
  authMiddleware,
  profileValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profileData = req.body;
      if (req.user.email !== profileData.email) {
        return res.status(403).json({ error: 'Unauthorized email' });
      }

      const athlete = await Athlete.findOneAndUpdate(
        { email: profileData.email },
        { ...profileData, updatedAt: new Date() },
        { new: true }
      );

      if (!athlete) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ success: true, athlete });
    } catch (err) {
      console.error('Update profile error:', err.message);
      next(err);
    }
  }
);

// Update profile photo
router.put(
  '/profile/photo',
  authMiddleware,
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('profilePhoto').notEmpty().withMessage('Profile photo is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, profilePhoto } = req.body;
      if (req.user.email !== email) {
        return res.status(403).json({ error: 'Unauthorized email' });
      }

      const athlete = await Athlete.findOneAndUpdate(
        { email },
        { profilePhoto, updatedAt: new Date() },
        { new: true }
      );

      if (!athlete) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ success: true, athlete });
    } catch (err) {
      console.error('Update profile photo error:', err.message);
      next(err);
    }
  }
);

// Get all athlete profiles
router.get(
  '/profiles',
  authMiddleware,
  async (req, res, next) => {
    try {
      const athletes = await Athlete.find();
      res.json(athletes);
    } catch (err) {
      console.error('Get all profiles error:', err.message);
      next(err);
    }
  }
);

module.exports = router;
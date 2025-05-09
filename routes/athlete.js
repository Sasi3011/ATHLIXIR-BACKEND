const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Athlete = require('../models/athlete');
const router = express.Router();
const auth = require('../middleware/auth'); // Updated to use consistent auth middleware

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
  auth,
  profileValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      email,
      address,
      district,
      state,
      phone,
      nationality,
      dateOfBirth,
      gender,
      sportsCategory,
      biography,
      yearsOfExperience,
      athleteType,
      languagesSpoken,
      medalsAndAwards,
      competingSince,
      goals,
      profilePhoto,
      skillLevel
    } = req.body;

    try {
      // Check if athlete profile already exists
      let athlete = await Athlete.findOne({ email });

      if (athlete) {
        // Update existing profile
        athlete = await Athlete.findOneAndUpdate(
          { email },
          {
            fullName,
            address,
            district,
            state,
            phone,
            nationality,
            dateOfBirth,
            gender,
            sportsCategory,
            biography,
            yearsOfExperience,
            athleteType,
            languagesSpoken,
            medalsAndAwards,
            competingSince,
            goals,
            profilePhoto,
            skillLevel,
            updatedAt: Date.now()
          },
          { new: true }
        );

        return res.json(athlete);
      }

      // Create new athlete profile
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      athlete = new Athlete({
        userId: user._id,
        email,
        fullName,
        address,
        district,
        state,
        phone,
        nationality,
        dateOfBirth,
        gender,
        sportsCategory,
        biography,
        yearsOfExperience,
        athleteType,
        languagesSpoken,
        medalsAndAwards,
        competingSince,
        goals,
        profilePhoto,
        skillLevel
      });

      await athlete.save();

      // Update user's profileCompleted status
      await User.findByIdAndUpdate(user._id, { profileCompleted: true });

      res.json(athlete);
    } catch (err) {
      console.error('Error saving athlete profile:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// Get athlete profile
router.get('/profile', auth, async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ email: req.user.email });
    
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete profile not found' });
    }

    res.json(athlete);
  } catch (err) {
    console.error('Error fetching athlete profile:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
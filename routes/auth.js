const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Athlete = require('../models/athlete');
const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['athlete', 'coach']).withMessage('Invalid user type'),
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  body('userType').isIn(['athlete', 'coach']).withMessage('Invalid user type'),
];

// Register user
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userType } = req.body;

    // Check if user exists
    let user = await User.findOne({ email, userType });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email,
      password: hashedPassword,
      userType,
      profileCompleted: false,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, userType: user.userType },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    next(err);
  }
});

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    console.log('Received login request:', req.body.email);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userType } = req.body;

    // Check if user exists
    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
});

// Check profile completion
router.get('/profile-completion/:email', async (req, res, next) => {
  try {
    console.log('Checking profile completion for:', req.params.email);
    const { email } = req.params;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user is an athlete, check for athlete profile
    if (user.userType === 'athlete') {
      const athlete = await Athlete.findOne({ email });
      return res.json(!!athlete); // Returns true if profile exists, false otherwise
    }

    // For non-athletes, assume profile is complete
    res.json(true);
  } catch (err) {
    console.error('Profile completion check error:', err.message);
    next(err);
  }
});

// Request password reset
router.post('/password-reset', [
  body('email').isEmail().withMessage('Invalid email address'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real app, generate and send reset token via email
    // For simplicity, return a mock response
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Password reset request error:', err.message);
    next(err);
  }
});

// Verify reset token
router.post('/verify-reset-token', [
  body('email').isEmail().withMessage('Invalid email address'),
  body('token').notEmpty().withMessage('Token is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // In a real app, verify the reset token
    // For simplicity, return a mock response
    res.json({ valid: true });
  } catch (err) {
    console.error('Token verification error:', err.message);
    next(err);
  }
});

// Reset password
router.post('/reset-password', [
  body('email').isEmail().withMessage('Invalid email address'),
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    next(err);
  }
});

module.exports = router;
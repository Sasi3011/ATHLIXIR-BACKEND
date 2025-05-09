const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, body, validationResult } = require('express-validator');
const config = require('config');
const auth = require('../middleware/auth'); // Use unified auth middleware
const jwtSecret = process.env.JWT_SECRET || config.get('jwtSecret');

const User = require('../models/User');
const Athlete = require('../models/athlete');

// -------------------- VALIDATION --------------------
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['athlete', 'user']).withMessage('Invalid user type'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  body('userType').isIn(['athlete', 'user']).withMessage('Invalid user type'),
];

// -------------------- AUTH ROUTES --------------------

// @route   GET /api/auth
// @desc    Get authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth (Login)
// @desc    Authenticate user & return token
// @access  Public
router.post('/', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, userType } = req.body;

  try {
    const user = await User.findOne({ email, userType });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Athlete profile check
    let profileCompleted = user.profileCompleted;
    if (userType === 'athlete') {
      const athleteProfile = await Athlete.findOne({ email });
      if (!!athleteProfile && !user.profileCompleted) {
        await User.findByIdAndUpdate(user._id, { profileCompleted: true });
        profileCompleted = true;
      }
    }

    const payload = {
      user: {
        id: user._id.toString(), // Ensure ID is a string
        email: user.email,
        userType: user.userType,
        profileCompleted,
      },
    };

    jwt.sign(payload, jwtSecret, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          userType: user.userType,
          profileCompleted,
        },
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, userType } = req.body;

  try {
    let user = await User.findOne({ email, userType });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      userType,
      profileCompleted: false,
    });

    await user.save();

    const payload = {
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profileCompleted: user.profileCompleted,
      },
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

    res.json({ token, user: payload.user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

// -------------------- PROFILE STATUS ROUTES --------------------

// @route GET /api/auth/profile-completion/:email
router.get('/profile-completion/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.userType !== 'athlete') return res.json(true);

    const athleteProfile = await Athlete.findOne({ email });
    return res.json(!!athleteProfile);
  } catch (err) {
    console.error('Profile check error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /api/auth/debug-profile/:email
router.get('/debug-profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found', email });

    const athleteProfile = await Athlete.findOne({ email });
    res.json({
      userDetails: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profileCompletedFlag: user.profileCompleted,
      },
      profileExists: !!athleteProfile,
      athleteProfileId: athleteProfile ? athleteProfile._id.toString() : null,
      athleteUserId: athleteProfile ? athleteProfile.userId.toString() : null,
      userIdMatch: athleteProfile
        ? user._id.toString() === athleteProfile.userId.toString()
        : false,
    });
  } catch (err) {
    console.error('Debug profile error:', err.message);
    res.status(500).send('Server error');
  }
});

// -------------------- PASSWORD RESET ROUTES --------------------

// @route POST /api/auth/password-reset
router.post('/password-reset', [body('email').isEmail().withMessage('Invalid email')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ message: 'Password reset email sent (mock)' });
});

// @route POST /api/auth/verify-reset-token
router.post('/verify-reset-token', [
  body('email').isEmail().withMessage('Invalid email'),
  body('token').notEmpty().withMessage('Token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  res.json({ valid: true }); // Mock response
});

// @route POST /api/auth/reset-password
router.post('/reset-password', [
  body('email').isEmail().withMessage('Invalid email'),
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

module.exports = router;
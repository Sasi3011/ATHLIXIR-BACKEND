const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const socket = require('../socket');
const router = express.Router();

// Log User model import
console.log('User model imported in auth.js:', User ? 'Success' : 'Failed');

// Email transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} catch (err) {
  console.warn('Nodemailer configuration failed:', err.message);
  console.warn('Password reset emails will not be sent');
}

// Register User
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('userType').isIn(['athlete', 'user']).withMessage('User type must be either "athlete" or "user"'),
  ],
  async (req, res, next) => {
    try {
      // Debug: Log the request body
      console.log('Register request body:', req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Debug: Log validation errors
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, userType } = req.body;
    
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        userType,
      });
      await user.save();

      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      res.status(201).json({
        user: { id: user._id, email: user.email, userType: user.userType },
        token,
      });
    } catch (err) {
      console.error('Register error:', err.message);
      next(err);
    }
  }
);

// Login User
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    body('userType').isIn(['athlete', 'user']).withMessage('User type must be either "athlete" or "user"'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, userType } = req.body;
      const user = await User.findOne({ email: email.toLowerCase(), userType });
      if (!user) {
        return res.status(401).json({ error: 'Email or user type not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      // Emit real-time login event
      socket.getIO().emit('userLogin', { email, userType, timestamp: new Date() });

      res.json({
        user: { id: user._id, email: user.email, userType: user.userType },
        profileCompleted: user.profileCompleted,
        token,
      });
    } catch (err) {
      console.error('Login error:', err.message);
      next(err);
    }
  }
);

// Check Profile Completion
router.get('/profile-completion/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.profileCompleted);
  } catch (err) {
    console.error('Profile completion error:', err.message);
    next(err);
  }
});

// Request Password Reset
router.post(
  '/password-reset',
  [body('email').isEmail().withMessage('Invalid email address')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: 'Email not found' });
      }

      const resetToken = Math.random().toString(36).substring(2, 15);
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000;
      await user.save();

      if (transporter) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${email}&token=${resetToken}`;
        await transporter.sendMail({
          to: email,
          subject: 'Password Reset Request',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        });
        res.json({ success: true, message: 'Password reset email sent' });
      } else {
        res.json({ success: true, message: 'Password reset token generated (email not sent due to configuration)' });
      }
    } catch (err) {
      console.error('Password reset error:', err.message);
      next(err);
    }
  }
);

// Verify Reset Token
router.post('/verify-reset-token', async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Verify reset token error:', err.message);
    next(err);
  }
});

// Reset Password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, token, newPassword } = req.body;
      const user = await User.findOne({ email: email.toLowerCase(), resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
      console.error('Reset password error:', err.message);
      next(err);
    }
  }
);

module.exports = router;
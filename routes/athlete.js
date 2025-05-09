const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Athlete = require('../models/athlete');
const router = express.Router();
const auth = require('../middleware/unifiedAuth'); // Use unified auth middleware

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
      
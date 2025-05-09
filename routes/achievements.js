const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @route   GET /api/achievements
// @desc    Get all achievements for an athlete
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const athleteEmail = req.user.email;
    const achievements = await Achievement.find({ athleteEmail })
      .sort({ date: -1 })
      .lean();
    
    res.json(achievements);
  } catch (err) {
    console.error('Error in fetching achievements:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/achievements/:id
// @desc    Get achievement by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id).lean();
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }

    // Check if achievement belongs to the authenticated user
    if (achievement.athleteEmail !== req.user.email) {
      return res.status(401).json({ msg: 'Not authorized to access this achievement' });
    }

    res.json(achievement);
  } catch (err) {
    console.error('Error in fetching achievement by ID:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/achievements
// @desc    Add a new achievement
// @access  Private
router.post('/', [
  auth,

    check('title', 'Title is required').not().isEmpty(),
    check('event', 'Event is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty()

], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      event,
      medalType,
      date,
      startDate,
      endDate,
      description,
      isCareerHighlight,
      isPersonalBest,
      performanceDetails,
      performanceList,
      athleteImage
    } = req.body;

    // Create achievement object
    const newAchievement = new Achievement({
      title,
      event,
      medalType: medalType || 'gold',
      date: new Date(date),
      startDate: startDate ? new Date(startDate) : new Date(date),
      endDate: endDate ? new Date(endDate) : new Date(date),
      description,
      isCareerHighlight: isCareerHighlight || false,
      isPersonalBest: isPersonalBest || false,
      performanceDetails: performanceDetails || [],
      performanceList: performanceList || [],
      athleteEmail: req.user.email,
      athleteImage
    });

    const achievement = await newAchievement.save();
    
    // Emit socket event for real-time updates
    req.app.get('io').to(req.user.email).emit('achievement-added', achievement);
    
    res.json(achievement);
  } catch (err) {
    console.error('Error in adding achievement:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/achievements/:id
// @desc    Update an achievement
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }

    // Check if achievement belongs to the authenticated user
    if (achievement.athleteEmail !== req.user.email) {
      return res.status(401).json({ msg: 'Not authorized to update this achievement' });
    }

    // Update fields
    const updateFields = { ...req.body, updatedAt: Date.now() };
    
    // Convert date strings to Date objects
    if (updateFields.date) updateFields.date = new Date(updateFields.date);
    if (updateFields.startDate) updateFields.startDate = new Date(updateFields.startDate);
    if (updateFields.endDate) updateFields.endDate = new Date(updateFields.endDate);

    // Update achievement
    achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // Emit socket event for real-time updates
    req.app.get('io').to(req.user.email).emit('achievement-updated', achievement);
    
    res.json(achievement);
  } catch (err) {
    console.error('Error in updating achievement:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/achievements/:id
// @desc    Delete an achievement
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }

    // Check if achievement belongs to the authenticated user
    if (achievement.athleteEmail !== req.user.email) {
      return res.status(401).json({ msg: 'Not authorized to delete this achievement' });
    }

    await Achievement.findByIdAndDelete(req.params.id);
    
    // Emit socket event for real-time updates
    req.app.get('io').to(req.user.email).emit('achievement-deleted', req.params.id);
    
    res.json({ msg: 'Achievement removed' });
  } catch (err) {
    console.error('Error in deleting achievement:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
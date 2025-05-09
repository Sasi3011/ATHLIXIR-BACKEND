const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Get all conversations for a user
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.email': req.user.email,
    }).sort({ lastMessageTime: -1 });
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new conversation
router.post('/create', auth, async (req, res) => {
  try {
    const { participantEmail } = req.body;
    const participant = await User.findOne({ email: participantEmail });
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const conversation = new Conversation({
      participants: [
        {
          userId: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        },
        {
          userId: participant._id,
          email: participant.email,
          name: participant.name,
          role: participant.role,
        },
      ],
    });
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive/unarchive a conversation
router.put('/:conversationId/archive', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    conversation.archived = !conversation.archived;
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
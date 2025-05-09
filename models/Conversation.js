const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String },
    },
  ],
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
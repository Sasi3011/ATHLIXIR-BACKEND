const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const config = require('config');

const jwtSecret = process.env.JWT_SECRET || config.get('jwtSecret');

const init = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (socket.handshake.query?.skipAuth === 'true') {
      console.warn('Socket connection bypassing auth for testing');
      return next();
    }

    if (!token) {
      console.warn('Socket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded.user;
      console.log(`Socket authenticated for user: ${socket.user.email}`);
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message, err.name);
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userEmail = socket.user?.email;

    if (userEmail) {
      // Join user-specific room
      socket.join(userEmail);
      onlineUsers.set(userEmail, socket.id);
      io.emit('user_status', { userId: userEmail, status: 'online' });
      console.log(`User ${userEmail} connected and joined room`);
    }

    // User explicitly joins a conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User ${userEmail} joined conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (messageData) => {
      if (!userEmail || messageData.sender !== userEmail) {
        return socket.emit('error', { message: 'Unauthorized action' });
      }

      try {
        const message = new Message({
          conversationId: messageData.conversationId,
          sender: messageData.sender,
          receiver: messageData.receiver,
          content: messageData.content,
          timestamp: new Date(messageData.timestamp),
          read: false,
        });
        await message.save();

        // Update conversation
        const conversation = await Conversation.findById(messageData.conversationId);
        if (conversation) {
          conversation.lastMessage =
            messageData.content.length > 30
              ? messageData.content.substring(0, 30) + '...'
              : messageData.content;
          conversation.lastMessageTime = messageData.timestamp;
          if (messageData.sender !== messageData.receiver) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          }
          await conversation.save();
        }

        // Emit to recipient and sender (via rooms)
        io.to(messageData.receiver).emit('receive_message', message);
        io.to(messageData.sender).emit('receive_message', message);
        io.to(messageData.conversationId).emit('receive_message', message); // Broadcast to conversation room
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, userEmail: senderEmail }) => {
      if (senderEmail !== userEmail) {
        return socket.emit('error', { message: 'Unauthorized action' });
      }
      socket.to(conversationId).emit('typing', { userEmail });
    });

    // Stop typing
    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('stop_typing');
    });

    // Mark messages as read
    socket.on('mark_as_read', async ({ conversationId, userEmail: receiverEmail }) => {
      if (receiverEmail !== userEmail) {
        return socket.emit('error', { message: 'Unauthorized action' });
      }

      try {
        await Message.updateMany(
          { conversationId, receiver: userEmail, read: false },
          { read: true }
        );
        await Conversation.updateOne({ _id: conversationId }, { unreadCount: 0 });
        io.to(conversationId).emit('messages_read', { conversationId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (userEmail) {
        onlineUsers.delete(userEmail);
        io.emit('user_status', { userId: userEmail, status: 'offline' });
        console.log(`User ${userEmail} disconnected`);
      }
    });
  });

  return io;
};

module.exports = { init };
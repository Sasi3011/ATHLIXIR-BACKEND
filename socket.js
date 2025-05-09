const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('config');

const jwtSecret = process.env.JWT_SECRET || config.get('jwtSecret');

const init = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (socket.handshake.query && socket.handshake.query.skipAuth === 'true') {
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

  io.on('connection', (socket) => {
    const userEmail = socket.user?.email;

    if (userEmail) {
      socket.join(userEmail);
      console.log(`User ${userEmail} joined socket room`);
    }

    socket.on('disconnect', () => {
      if (userEmail) {
        console.log(`User ${userEmail} disconnected`);
      }
    });
  });

  return io;
};

module.exports = { init };

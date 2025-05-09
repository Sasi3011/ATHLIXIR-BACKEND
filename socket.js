const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || require('config').get('jwtSecret');

let io;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5177',
  'http://localhost:8083',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5176',
  'https://athlixir.technovanam.com',
  'https://athlixir-backend.onrender.com',
  'https://athlixir-technovanam.vercel.app',
  process.env.FRONTEND_URL,
];

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.log('Socket.IO - Origin not allowed:', origin);
            callback(new Error('CORS Error: Origin not allowed'), false);
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Origin', 'Accept']
      },
    });

    // JWT Authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));

      try {
        const decoded = jwt.verify(token, jwtSecret);
        socket.user = decoded.user;
        next();
      } catch (err) {
        console.error('Socket auth error:', err.message);
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    // On client connection
    io.on('connection', (socket) => {
      const userEmail = socket.user?.email || socket.id;
      console.log(`Socket connected: ${userEmail}`);

      // Join a personal room
      if (socket.user?.email) {
        socket.join(socket.user.email);
      }

      // Custom event handling
      socket.on('achievement-update', (data) => {
        io.to(socket.user.email).emit('achievement-updated', data);
      });

      // On disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${userEmail}`);
      });
    });

    console.log('Socket.IO initialized');
    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO not initialized! Call socket.init(server) first.');
    }
    return io;
  }
};
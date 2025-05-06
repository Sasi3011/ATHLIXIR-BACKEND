let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    
    // Define allowed origins - keep in sync with server.js
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'https://athlixir.technovanam.com',
      'https://athlixir-backend.onrender.com',
    ];
    
    io = new Server(httpServer, {
      cors: {
        origin: function(origin, callback) {
          // Allow requests with no origin (like mobile apps, curl requests)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.log('Socket.IO - Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Log the origin for debugging
      console.log('Socket connected from origin:', socket.handshake.headers.origin);
      
      socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
    });

    console.log('Socket.IO initialized');
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO not initialized! Ensure socket.init() is called before using getIO().');
    }
    return io;
  },
};
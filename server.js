require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socket = require('./socket');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const userRoutes = require('./routes/users');
const achievementsRoutes = require('./routes/achievements');
const athletesRoutes = require('./routes/athletes');


// Environment variable check
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
connectDB();

// Allowed Origins
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
  process.env.FRONTEND_URL,
];

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`❌ Origin rejected by CORS: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug: log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: {
      'origin': req.headers['origin'] || 'none',
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [...]' : 'none',
      'x-auth-token': req.headers['x-auth-token'] ? '[...]' : 'none'
    },
    body: req.body
  });
  next();
});

app.get('/api/debug/auth-test', auth, (req, res) => {
  res.json({ 
    message: 'Authentication successful', 
    user: req.user 
  });
});

// Test route without auth
app.get('/api/debug/no-auth', (req, res) => {
  res.json({ message: 'Server is working properly' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/athlete', athleteRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/achievements', require('./routes/achievements')); // ✅ this must be present


// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static assets (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
}

// Error logging middleware (after routes)
app.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.log(`❌ Error response (${res.statusCode}): ${data}`);
    }
    if (typeof oldSend === 'function') {
      return oldSend.apply(res, arguments);
    } else {
      console.error('oldSend is not a function. Cannot send response properly.');
      return;
    }
  };
  next();
});

// Final error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create HTTP server
const server = http.createServer(app);

// Init Socket.IO
const io = socket.init(server);
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

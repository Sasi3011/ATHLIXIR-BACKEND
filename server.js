require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const socket = require('./socket');

const app = express();

// Environment variable validation
const { MONGO_URI, JWT_SECRET, FRONTEND_URL } = process.env;
console.log('MONGO_URI:', MONGO_URI);
if (!MONGO_URI || !JWT_SECRET || !FRONTEND_URL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// MongoDB connection
mongoose.connect(MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5177',
  'http://localhost:8083',
  'https://athlixir.technovanam.com',
  'https://athlixir-backend.onrender.com',
  FRONTEND_URL, // From .env
];

// CORS middleware - Use one approach, not multiple
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Express middleware for parsing JSON
app.use(express.json({ limit: '10mb' }));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
}));

// Routes
console.log('Mounting routes...');

// Mount routes at both paths to ensure compatibility
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/athlete', athleteRoutes);
app.use('/athlete', athleteRoutes);

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

console.log('Routes mounted: /api/auth, /auth, /api/athlete, /athlete');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Socket.IO initialization
socket.init(server);
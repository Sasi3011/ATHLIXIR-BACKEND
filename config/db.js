const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || config.get('mongoURI');
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || require('config').get('jwtSecret');

module.exports = function(req, res, next) {
  // Try to get token from x-auth-token header first (for API routes)
  let token = req.header('x-auth-token');
  
  // If not found, try Authorization header (Bearer token)
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }
    
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
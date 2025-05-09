// In socket.js
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  
  // Skip auth for specific paths if needed
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
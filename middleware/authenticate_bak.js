const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed

module.exports = async function authenticate(req, res, next) {

  let errmsg = '';
  console.log('authenticate.js:  accessToken:', req.headers.authorization);
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded payload:", decoded);
    console.log('authenticate.js:  decoded.userId: ', decoded.userId);

    // 🔍 Fetch user from DB using decoded _id
    const user = await User.findById(decoded.userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } else {
      console.log("authenticate.js:  email: ", user.email);
    }

    // ✅ Attach user to request
    req.user = user;
    next();
  } catch (err) {

    //console.error('Auth error:', err);
    if (err.name === 'TokenExpiredError') {
      console.error("Token has expired.");
      errmsg = 'Session expired, please login again';
    } else if (err.name === 'JsonWebTokenError') {
      console.error("Invalid token.");      
      errmsg = 'Unauthorized';
    } else {
      console.error("Token verification failed:", err.message);      
      errmsg = 'Oops! Token verification failed, please try again';
    }
    
    res.status(401).json({ message: errmsg });
  }
};
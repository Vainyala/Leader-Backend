//middleware/authenticate.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed

module.exports = async function authenticate(req, res, next) {

  try {
    const method = req.method;
    const user_type = req.user_type;

    console.log('authenticate: Req.User_Type received: ', user_type, ' Method: ', method);

    if (method === 'GET' || method === 'DELETE') {
      user_email_id = (req.query.user_email_id || '').toLowerCase().trim();
      leader_regd_mobile_no = req.query.leader_regd_mobile_no;
      console.log('authenticate: Method: ', method, ' Query Params: ', leader_regd_mobile_no, ', ', user_email_id);
    } else {
      user_email_id = (req.body.user_email_id || '').toLowerCase().trim();
      leader_regd_mobile_no = req.body.leader_regd_mobile_no;
      console.log('authenticate: Method: ', method, ' Body Params: ', leader_regd_mobile_no, ', ', user_email_id);
    }

    //console.log('authenticate.js:  accessToken:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;

    //console.log('accessToken received:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('authenticate: accessToken received: ', token, '\nDecoded payload: ', decoded);
   
    // Fetch user from DB using decoded _id
    const user = await User.findById(decoded.userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } 

    console.log('authenticate: user_email_id from Input Param: ', user_email_id, 'From DB: ', user.user_email_id);
    console.log("authenticate: leader_regd_mobile_no from Input Param: ", leader_regd_mobile_no, " From DB: ", user.leader_regd_mobile_no);

    // Validate leader number
    if (user.leader_regd_mobile_no !== leader_regd_mobile_no) {
      console.log("authenticate.js:  Invalid leader_regd_mobile_no: \nInput Number: ",
        leader_regd_mobile_no, "Number fetched from DB: ", user.leader_regd_mobile_no);
      return res.status(401).json({ message: 'Unauthorized: leader number mismatch' });
    }
    
    // Validate email
    if (user.user_email_id.toLowerCase().trim() !== user_email_id) {
      return res.status(404).json({ message: 'Invalid User Email Id..Please check and retry!' });
    }
    
    // Attach user to request
    req.user = user;
    console.log('authenticate: Returning req.user_type: ', req.user_type);
    //req.user_type = user_type;
    next();
  } catch (err) {
    let errmsg;
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
    return res.status(401).json({ message: errmsg });
  }
};
const { formatISTTimestamps } = require('../utils/timeFormatter');
const User = require('../models/User');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs'); //  For Change Password --- Hashing
const sendEmailOTP = require('../utils/sendOTP');

// View Profile
exports.viewProfile = async (req, res) => {

  //console.log("viewProfile: Headers:", req.headers);
  console.log("viewProfile: Request Query Params:", req.query);
  const { leader_regd_mobile_no, user_email_id } = req.query;

  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;
    
  logger.info(`[${requestId}] viewProfile(User) of: ${user_email_id} of: ${leader_regd_mobile_no}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);
  logger.info(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  try {
    const userId = req.user.id; // Set by JWT middleware

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

/*
    const formattedData = formatISTTimestamps(user);
    res.status(200).json({ formattedData });
  } catch (err) {
    console.error('View Profile Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
*/
      const { profile_image, _id: recordId } = user;
  
      if (profile_image) {
        user.profile_image = `${hostUrl}/profile/${profile_image}`;
        logger.debug(`[${requestId}] Member image URL constructed: ${user.profile_image}`);
        logger.info(`[${requestId}] Member image URL constructed: ${user.profile_image}`);
      } else {
        logger.warn(`[${requestId}] No member image found for record ID: ${recordId}`);
      }
  
      logger.info(`[${requestId}] Successfully fetched User Profile Data for ${leader_regd_mobile_no}`);
      const formattedData = formatISTTimestamps(user);
  
      res.status(200).json({ user_profile: formattedData });
      
    } catch (error) {
      logger.error(`[${requestId}] Error fetching profile: ${error.message}`, { stack: error.stack });
      return next(error);
    }
};

// Edit Profile :   POST & PUT Methods -- Both
exports.editProfile = async (req, res, next) => {

  //console.log("editProfile: Headers:", req.headers);
  console.log("editProfile: Body:", req.body);
  
  // const user_email_id = req.body.email;  // Non-Editable as it is used as Login Id
  
  try {
    const userId = req.user.id;

    const updates = {
      mobile: req.body.mobile,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      pincode: req.body.pincode,
      facebook: req.body.facebook,
      twitter: req.body.twitter,
      instagram: req.body.instagram
    };

    if (req.file) {
      updates.profile_image = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    const formattedData = formatISTTimestamps(updatedUser);
    res.status(200).json({
      message: 'Profile updated successfully',
      user: formattedData
    });
  } catch (err) {
    console.error('Edit Profile Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// 29/10/2025
// Change Password :   PUT Methods 
exports.changePassword = async (req, res, next) => {

  console.log("changePassword: Body:", req.body);
  
  try {
    const userId = req.user.id;
    console.log("changePassword: userId received from authenticate.js: ", userId);
    const { user_email_id, opassword, npassword } = req.body;
    const email = user_email_id;

   console.log('user_email_id from req.body: ', email);

    const user = await User.findOne({ user_email_id });
    
    if (!user ) return res.status(400).json({ message: 'User not found or not verified' });

    const isMatch = await bcrypt.compare(opassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    const hashedPassword = await bcrypt.hash(npassword, 10);
    const updates = {
       password: hashedPassword
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    });

    if (updatedUser) {
      res.status(200).json({
        message: 'Password changed successfully',
      });
    } else {
      return res.status(401).json({ message: 'Alert! Password change failed, please retry.' });
    }
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 02/11/2025
// To get User Document URL

// View Profile
exports.viewProfileDocument = async (req, res) => {

  console.log("viewProfileDocument: Request Query Params:", req.query);
  const { leader_regd_mobile_no, user_email_id } = req.query;

  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;
    
  logger.info(`[${requestId}] viewProfile(User) of: ${user_email_id} of: ${leader_regd_mobile_no}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);
  logger.info(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  try {
    const userId = req.user.id; // Set by JWT middleware

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

      const { profile_doc, _id: recordId } = user;
  
      if (profile_doc) {
        user.profile_doc = `${hostUrl}/profile/${profile_doc}`;
        logger.debug(`[${requestId}] Member image URL constructed: ${user.profile_doc}`);
        logger.info(`[${requestId}] Member image URL constructed: ${user.profile_doc}`);
      } else {
        logger.warn(`[${requestId}] No member image found for record ID: ${recordId}`);
      }
  
      logger.info(`[${requestId}] Successfully fetched User Profile Data for ${leader_regd_mobile_no}`);
      const formattedData = formatISTTimestamps(user);
  
      res.status(200).json({ user_profile: formattedData });
      
    } catch (error) {
      logger.error(`[${requestId}] Error fetching profile: ${error.message}`, { stack: error.stack });
      return next(error);
    }
};


//27/11/2025
 exports.verifyEmail = async (req, res) => {
  let status_code = 400;
  try {
        
    const regd_mobile_no = req.body.leader_regd_mobile_no; 
    const email = req.body.user_email_id;
    console.log('Request Body:', regd_mobile_no, ', ', email);

    if (!regd_mobile_no || !email) {
      return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
    }

    const registeruser = await User.findOne({
      leader_regd_mobile_no : regd_mobile_no,
      user_email_id: email.toLowerCase().trim() 
    });

    if (!registeruser) {
      console.log("Email id not FOUND");
       res.status(401).json({ message: 'Email id not found', email });
    } else {
      registeruser.isEmailVerified = true;
      await registeruser.save();

      console.log('Email id verified successfully', email );
      res.status(201).json({ message: 'Email id verified successfully', email });
    }
  } catch (err) {
      console.error('Verify Email :', err);

      let message = err.message;

      if (err.code === 11000) {
        console.error('Error Code:', err.code, ' Error Message', err.message);
        status_code = 409;
        message = "Email Id already registered, please proceed to Login!";
      } 
      res.status(status_code).json({ message });
    }
};


// 26/11/2025

exports.sendOTP = async (req, res) => {
  console.log("sendOTP:  Req.body: ", req.body);

  try {
    const email = req.body.user_email_id;

    const email_otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!email) {
      return res.status(400).json({ message: 'Missing Body Params: Email is required' });
    }

    console.log("Searching for email:", `"${email}"`);
    console.log("Looking for email:", email);
    const registeruser = await User.findOne({ user_email_id: email.toLowerCase().trim() });
    //const registeruser = await Registeruser.findOne({ email: new RegExp(`^${email}$`, 'i') });
    console.log("Found user:", registeruser);

    //const registeruser = await Registeruser.findOne({ email });
    
    if (!registeruser) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (!registeruser.isEmailVerified) {
      console.log('Alert! Email is not verified, Plz verify Email and then retry', email );
      return res.status(400).json({ message: 'Alert! Email is not verified, Plz verify Email and then retry' });
    } 
    
    console.log('sendOTP API: isEmailVerified: ', registeruser.isEmailVerified);

    // Update email_otp in database
    registeruser.email_otp = email_otp;
    registeruser.isEmailVerified = false; // Set to disable recalling of send otpp api
    await registeruser.save();

    console.log("Email OTP updated: ", email_otp);

    await sendEmailOTP(email, email_otp);
    res.status(200).json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error('send Email OTP Error:', err);
    res.status(400).json({ error: err.message });
  }
};


//Verify email otp durimng Forgot Password

exports.verifyEmailOTP = async (req, res) => {
  try {
    const email = req.body.user_email_id;
    const otp = req.body.otp;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Missing Body Params: Email and OTP are required' });
    }

    const registeruser = await User.findOne( { user_email_id: email.toLowerCase().trim() });

    if (!registeruser) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (!registeruser.email_otp) {
      console.log('Alert! Email OTP is not found, Plz call Send Email OTP API & retry', email );
      return res.status(400).json({ message: 'Alert! Email OTP is not found, Plz send email OTP and then retry' });
    }

    // Check OTP
    if (registeruser.email_otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP, Try again!' });
    }

    // Mark email otp verified as true = verified
    registeruser.isEmailOTPVerified = true;
    registeruser.email_otp = '1a2b3c'; // Update as null to disable recalling the api without sequence
    const result = await registeruser.save();
    if (result) {
          console.log('isEmailotpVerified set to true');
          res.status(200).json({
          message: 'Email OTP verified successfully!',
        });
      } else {
        console.log('isEmailotpVerified = true -- Failed to update in User DB');
        return res.status(400).json({ message: 'Internal Server Error, Try again!' });      
      }

  } catch (err) {
    console.error("Email OTP verification error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Forgot Password :   PUT Methods 
exports.forgotPassword = async (req, res, next) => {

  console.log("forgotPassword: Body:", req.body);
  
  try {
    const { user_email_id, npassword } = req.body;
    const email = user_email_id;

    console.log('user_email_id from req.body: ', email);

    const user = await User.findOne({ user_email_id: email.toLowerCase().trim() });
    
    if (!user ) {
      console.log('User not found or not verified' );
      return res.status(400).json({ message: 'User not found or not verified' });
    }

    if (!user.isEmailOTPVerified) {
      console.log('Alert! Email OTP is not verified, Plz verify Email OTP and then retry' );
      return res.status(400).json({ message: 'Alert! Email OTP is not verified, Plz verify Email OTP and then retry' });
    }

    const hashedPassword = await bcrypt.hash(npassword, 10);
    
    // Mark email as verified
    user.password = hashedPassword;
    user.isEmailOTPVerified = false;  // Update false to avoid calling forgot password api directly
    
    await user.save();

    console.log('Forgot Password API: isEmailVerified & isEmailotpVerified set to false in Users DB');
    const updatedUser = await user.save();

    if (updatedUser) {
        console.log('Password updated successfully');
        res.status(200).json({
        message: 'Password updated successfully',
      });
    } else {
      console.log('Alert! Password update failed, please retry.');
      return res.status(401).json({ message: 'Alert! Password update failed, please retry.' });
    }
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


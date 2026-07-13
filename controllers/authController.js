//vainyala code

//controllers/authController.js

const path = require('path');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Registeruser = require('../models/Registeruser');
const sendEmailOTP = require('../utils/sendOTP');
const sendGreeting = require('../utils/sendGreeting');
const AppOwner = require('../models/AppOwner');
const CryptoService = require('../services/cryptoService');
let status_code = 400;

// verify email - if its not already registered

 exports.verifyEmail = async (req, res) => {
  try {
    const regd_mobile_no = req.body.leader_regd_mobile_no; 
    const email = req.body.user_email_id;
    console.log('RegisterUser: verifyEmail: Request Body:', regd_mobile_no, ', ', email);

    if (!regd_mobile_no || !email) {
      return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
    }

    //let email = "nutantekdevops@gmail.com";
    //const mobile_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const email_otp = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await Registeruser.findOne({
      leader_regd_mobile_no : regd_mobile_no,
      user_email_id: email.toLowerCase().trim() 
    });

    if (result) {
      console.log("RegisterUser: verifyEmail: Email id already registered, Proceed to Login!");
       return res.status(401).json({ message: 'Email id already registered, Proceed to Login!', email });
    }

    // Email id not found, so proceed to Register

    const registeruser = await Registeruser.create({
      leader_regd_mobile_no: regd_mobile_no,
      user_email_id: email.toLowerCase().trim(),
      email_otp,
      isEmailVerified: true,
      isUserRegistered: false   
    });

    if (!registeruser) {
      console.log("RegisterUser: verifyEmail: Internal Server Error!");
      return res.status(401).json({ message: 'Internal Server Error!', email });
    }

    console.log("RegisterUser: verifyEmail: Email id not registered, Email OTP created:", email_otp);
     
    return res.status(201).json({ message: 'Email id not found, Proceed to Register', email });

  } catch (err) {
      console.error('Register ', err);

      let message = err.message;

      if (err.code === 11000) {
        console.error('RegisterUser: verifyEmail: Error Code:', err.code, ' Error Message', err.message);
        status_code = 409;
        message = "Email Id already registered, please proceed to Login!";
      } 
      return res.status(status_code).json({ message });
    }
};



exports.sendOTP = async (req, res) => {

  try {

    const regd_mobile_no = req.body.leader_regd_mobile_no; 
    const email = req.body.user_email_id;
    console.log('RegisterUser: sendOTP: Request Body:', regd_mobile_no, ', ', email);

    if (!regd_mobile_no || !email) {
      return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
    }

    const email_otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log("Searching for email:", `"${email}"`);
    console.log("Looking for email:", email);

    //const registeruser = await Registeruser.findOne({ email: email.toLowerCase().trim() });
    
    const registeruser = await Registeruser.findOne({
      leader_regd_mobile_no : regd_mobile_no,
      user_email_id: email.toLowerCase().trim() 
    });
  
    if (!registeruser) {
      console.log('RegisterUser: sendOTP: Email id not found to send OTP'); 
      return res.status(404).json({ message: 'Email not found' });
    } else{
        console.log('RegisterUser: sendOTP: Email id found and OTP to be sent!');
    }

    if (!registeruser.isEmailVerified) {
      console.log('RegisterUser: sendOTP: Alert! Email is not verified, Plz verify Email and then retry', email );
      return res.status(400).json({ message: 'Alert! Email is not verified, Plz verify Email and then retry' });
    } 
    
    console.log('sendOTP API: isEmailVerified: ', registeruser.isEmailVerified);

    if (registeruser.isUserRegistered) {
      console.log('RegisterUser: sendOTP: User is registered, proceed to login!'); 
      return res.status(400).json({ message: 'User is registered, proceed to login!' });
    }

    // Update email_otp in database
    registeruser.email_otp = email_otp;
    registeruser.isEmailVerified = false; // Set to disable recalling of send otpp api again
    await registeruser.save();

    console.log("RegisterUser: sendOTP: Email OTP updated: ", email_otp);

    await sendEmailOTP(email, email_otp);
    res.status(200).json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error('send Email OTP ', err);
    res.status(400).json({ error: err.message });
  }
};


//Verify email otp if the email is not registered

exports.verifyEmailOTP = async (req, res) => {
  try {
    const regd_mobile_no = req.body.leader_regd_mobile_no; 
    const email = req.body.user_email_id;
    const otp = req.body.otp;

    console.log('RegisterUser: verifyEmailOTP: Request Body:', regd_mobile_no, ', ', email);

    if (!regd_mobile_no || !email || !otp) {
      console.log('Missing Body Params: leader_regd_mobile_no / user_email_id / otp required');
      return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / user_email_id / otp required' });
    }


    const registeruser = await Registeruser.findOne({
      leader_regd_mobile_no : regd_mobile_no,
      user_email_id: email.toLowerCase().trim() 
    });

    if (!registeruser) {
      console.log('RegisterUser: verifyEmailOTP: Email id is not found');
      return res.status(404).json({ message: 'Email id is not found' });
    }

    if (registeruser.isUserRegistered) {
      console.log('RegisterUser: verifyEmailOTP: User is already registered, proceed to login!');
      return res.status(400).json({ message: 'User is already registered, proceed to login!' });
    }

    if (!registeruser.email_otp) {
      console.log('Alert! Email OTP is not found, Plz call Send Email OTP API & retry', email );
      return res.status(400).json({ message: 'Alert! Email OTP is not found, Plz send email OTP and  then retry' });
    }

    // Check OTP
    if (registeruser.email_otp !== otp) {
      console.log('RegisterUser: verifyEmailOTP: Invalid OTP, Try again!');
      return res.status(400).json({ message: 'Invalid OTP, Try again!' });
    }

    // let action = "otp";
    // await sendGreeting(email, action);

const encryptedMobile = CryptoService.encrypt(regd_mobile_no);

const owner = await AppOwner.findOne({
  client_regd_mobile_no: encryptedMobile
});

if (!owner) {
  return res.status(404).json({ message: 'AppOwner not found' });
}

let action = "otp";

await sendGreeting(
  email,
  action,
  owner.client_name,
  owner.client_app_name
);

    // Mark email otp verified = true/ verified
    registeruser.isEmailOTPVerified = true;
    registeruser.email_otp = '1a2b3c'; // Update as null to disable recalling the api without sequence
    await registeruser.save();
      
    console.log('RegisterUser: verifyEmailOTP: Email verified and greeted!');
    res.status(200).json({ message: 'Email verified and greeted!' });

  } catch (err) {
    console.error("RegisterUser: verifyEmailOTP: Email OTP verification error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Register a new user for a given leader_regd_mobile_no
 exports.register = async (req, res) => {

  let status_code = 400;
  try {
    // Add these logs here
    //console.log('User module type:', typeof User);
    //console.log('Is create available?', typeof User.create);
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);

    const { leader_regd_mobile_no, user_email_id, password, name, mobile, profile_image, address, city, district, state, pincode, facebook, twitter, instagram } = req.body;

    if ( !leader_regd_mobile_no || !user_email_id || !password || !name || !mobile || !address || !district || !state || !pincode ) {
      return res.status(400).json({ message: 'Missing params, check and try again' });
    }

    const registeruser = await Registeruser.findOne({
      leader_regd_mobile_no : leader_regd_mobile_no,
      user_email_id: user_email_id.toLowerCase().trim() 
    });

    if (!registeruser) {
      console.log('RegisterUser: register API: Email id is not verified!');
      return res.status(404).json({ message: 'Email id is not verified!' });
    }

    if (registeruser.isUserRegistered) {
      console.log('RegisterUser: register API: User is already registered, proceed to login!');
      return res.status(400).json({ message: 'User is already registered, proceed to login!' });
    }

    if (!registeruser.isEmailOTPVerified) {
      console.log('Alert! Email OTP is not verified, Plz call VerifyEmail OTP API & retry', user_email_id );
      return res.status(400).json({ message: 'Alert! Email OTP is not verifies, Plz send email OTP and  then retry' });
    }

    // Update the email otp verified = false in registerusers db
    registeruser.isEmailOTPVerified = false;  // Update false to avoid calling forgot password api directly
    await registeruser.save();

    // All checks done, proceed to register the user in user db
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      leader_regd_mobile_no: leader_regd_mobile_no,
      user_email_id: user_email_id.toLowerCase().trim(),
      password: hashedPassword,
      name,
      mobile,
      profile_image,
      address,
      city,
      district,
      state,
      pincode,
      facebook,
      twitter,
      instagram
    });

    
    if (registeruser) {
      registeruser.isUserRegistered = true;
      user.isEmailOTPVerified = false;  // Update false to avoid calling forgot password api directly
      await registeruser.save();
      console.log("isUserRegistered status updated.");
    } else {
      console.warn("Registeruser not found for email:", user_email_id);
    }

    // let action = "registered";
    // await sendGreeting(user_email_id, action );    
    
const encryptedMobile = CryptoService.encrypt(leader_regd_mobile_no);

const owner = await AppOwner.findOne({
  client_regd_mobile_no: encryptedMobile
});

if (!owner) {
  return res.status(404).json({ message: 'AppOwner not found' });
}

let action = "registered";

await sendGreeting(
  user_email_id,
  action,
  owner.client_name,
  owner.client_app_name
);

    return res.status(200).json({ message: 'Congrats! User registered successfully', email: user_email_id });
  } catch (err) {
      console.error('Register Error:', err);
      let message = err.message;
      status_code = 500;

      if (err.code === 11000) {
        console.error('Error Code:', err.code, ' Error Message', err.message);
        status_code = 409;
        message = "Email Id already registered, please proceed to Login!";
      } 
      return res.status(status_code).json({ message });
    }
};

// Login to app of a given leader_regd_mobile_no
exports.login = async (req, res) => {
  try {

    const regd_mobile_no = req.body.leader_regd_mobile_no; 
    const email = req.body.user_email_id;
    console.log('login API: Request Body:', regd_mobile_no, ', ', email);

    if (!regd_mobile_no || !email) {
      return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
    }

    const password = req.body.password;

    const user = await User.findOne({
      leader_regd_mobile_no : regd_mobile_no,
      user_email_id: email.toLowerCase().trim() 
    });
    
    if (!user ) {
      console.log('login API: User Email id is not found / not verified');
      return res.status(400).json({ message: 'User not found or not verified' });
    }

    const userId = user._id;

    console.log('User._id extracted: ', userId);

    /*  Commented on 29 June to allow parallel sessions for a user

    // Check if user is already logged in, then dont login again
    const result = await RefreshToken.findOne({ userId });
    if (result ) 
      return res.status(401).json({ message: 'Unauthorized! User already logged in.' });

    */

    // User is not logged in so proceed to login
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    console.log('user_id fetched: ', user._id);

    //const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const accessToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    );
    
    //const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.REFRESH_SECRET, 
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    );

    /* Commented on 29th June to allow parallel logins
    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    */

    console.log('login API: User Email id authenticated and logged in!');
    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



// Login to app of a given leader_regd_mobile_no --- Normal User Only
exports.adminLogin = async (req, res) => {
  try {

    const email = req.body.user_email_id;
    console.log('login API: Request Body:', email);

    if (!email) {
      return res.status(400).json({ message: 'Missing Body Params: Email id is required' });
    }

    const password = req.body.password;

    const user = await User.findOne({
      user_type : 'admin',
      user_email_id: email.toLowerCase().trim() 
    });
    
    if (!user ) {
      console.log('login API: Admin Email id is not found / not verified');
      return res.status(400).json({ message: 'Admin User not found.' });
    }
    
    /*  Commented on 29 June to allow parallel sessions for a user

    // Check if user is already logged in, then dont login again
    const result = await RefreshToken.findOne({ userId });
    if (result ) 
      return res.status(401).json({ message: 'Unauthorized! User already logged in.' });

    */

    // User is not logged in so proceed to login
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    // user email found andpassword verified so proceed to generate token and share json response

    // encrypt email id to access appowner db
    const encryptedEmail = CryptoService.encrypt(email);

    // Look up appowner db to fetch the leaderregd mobile number and app_key
    const owner = await AppOwner.findOne({ client_regd_email: encryptedEmail });
    if (!owner) {
      console.log('AppOwner not found'); // 404 return
      return res.status(400).json({ message: 'Admin User not found registered, Contact Service Provider.' });
    }

    // Leader found loop
    const app_key = owner.app_key;
    const leader_regd_mobile_no = CryptoService.decrypt(owner.client_regd_mobile_no);

    console.log('authController: adminLogin API: leader_regd_mobile_no: :', leader_regd_mobile_no, ' app_key: ', app_key);


    //Logic to generate token and ebbed app_key and leader_regd_mobile_no
    const userId = user._id;

    console.log('User._id extracted: ', userId);

    //const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const accessToken = jwt.sign(
      { 
        userId: user._id,
        app_key, 
        leader_regd_mobile_no
      },
      process.env.JWT_SECRET, 
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    );
    
    //const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        app_key, 
        leader_regd_mobile_no
      },
      process.env.REFRESH_SECRET, 
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    );

    /* Commented on 29th June to allow parallel logins
    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    */

    console.log('login API: User Email id authenticated and logged in!');
    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    console.log('refreshToken API: req.body: ', req.body);

    const token = req.body.refresh_token;
    if (!token) return res.status(403).json({ message: 'Refresh token required' });

    const stored = await RefreshToken.findOne({ token });
    if (!stored) return res.status(403).json({ message: 'Token invalid or expired' });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    console.log('refreshToken API: Decoded data: ', decoded);

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

    //const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '480m' });
    //const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

    res.status(200).json({ accessToken });
  } catch (err) {
    console.log('refreshToken API: ', err);
    res.status(403).json({ message: 'Token verification failed' });
  }
};

//  Logout
exports.logout = async (req, res) => {
  try {
    const refresh_token  = req.body.refresh_token;

    console.log("logout: Headers:", req.headers);
    console.log("logout: Body:", req.body);

    console.log("logout: Refresh Token received: ", refresh_token);

    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    

    if (typeof refresh_token !== 'string' || refresh_token.length < 20) {
      return res.status(400).json({ message: 'Invalid refresh token format' });
    }

    // Delete refreshToken from MongoDB
    const token = refresh_token;
    const result = await RefreshToken.deleteOne({ token });
  
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Refresh token not found or already invalidated' });
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(400).json({ message: 'Logout failed', error: err.message });
  }
};








//commented 13-07-2026


// const path = require('path');
// require('dotenv').config();

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const RefreshToken = require('../models/RefreshToken');
// const Registeruser = require('../models/Registeruser');
// const sendEmailOTP = require('../utils/sendOTP');
// const sendGreeting = require('../utils/sendGreeting');
// const AppOwner = require('../models/AppOwner');
// const CryptoService = require('../services/cryptoService');
// let status_code = 400;

// // verify email - if its not already registered

//  exports.verifyEmail = async (req, res) => {
//   try {
//     const regd_mobile_no = req.body.leader_regd_mobile_no; 
//     const email = req.body.user_email_id;
//     console.log('RegisterUser: verifyEmail: Request Body:', regd_mobile_no, ', ', email);

//     if (!regd_mobile_no || !email) {
//       return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
//     }

//     //let email = "nutantekdevops@gmail.com";
//     //const mobile_otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const email_otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const result = await Registeruser.findOne({
//       leader_regd_mobile_no : regd_mobile_no,
//       user_email_id: email.toLowerCase().trim() 
//     });

//     if (result) {
//       console.log("RegisterUser: verifyEmail: Email id already registered, Proceed to Login!");
//        return res.status(401).json({ message: 'Email id already registered, Proceed to Login!', email });
//     }

//     // Email id not found, so proceed to Register

//     const registeruser = await Registeruser.create({
//       leader_regd_mobile_no: regd_mobile_no,
//       user_email_id: email.toLowerCase().trim(),
//       email_otp,
//       isEmailVerified: true,
//       isUserRegistered: false   
//     });

//     if (!registeruser) {
//       console.log("RegisterUser: verifyEmail: Internal Server Error!");
//       return res.status(401).json({ message: 'Internal Server Error!', email });
//     }

//     console.log("RegisterUser: verifyEmail: Email id not registered, Email OTP created:", email_otp);
     
//     return res.status(201).json({ message: 'Email id not found, Proceed to Register', email });

//   } catch (err) {
//       console.error('Register ', err);

//       let message = err.message;

//       if (err.code === 11000) {
//         console.error('RegisterUser: verifyEmail: Error Code:', err.code, ' Error Message', err.message);
//         status_code = 409;
//         message = "Email Id already registered, please proceed to Login!";
//       } 
//       return res.status(status_code).json({ message });
//     }
// };



// exports.sendOTP = async (req, res) => {

//   try {

//     const regd_mobile_no = req.body.leader_regd_mobile_no; 
//     const email = req.body.user_email_id;
//     console.log('RegisterUser: sendOTP: Request Body:', regd_mobile_no, ', ', email);

//     if (!regd_mobile_no || !email) {
//       return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
//     }

//     const email_otp = Math.floor(100000 + Math.random() * 900000).toString();

//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }

//     console.log("Searching for email:", `"${email}"`);
//     console.log("Looking for email:", email);

//     //const registeruser = await Registeruser.findOne({ email: email.toLowerCase().trim() });
    
//     const registeruser = await Registeruser.findOne({
//       leader_regd_mobile_no : regd_mobile_no,
//       user_email_id: email.toLowerCase().trim() 
//     });
  
//     if (!registeruser) {
//       console.log('RegisterUser: sendOTP: Email id not found to send OTP'); 
//       return res.status(404).json({ message: 'Email not found' });
//     } else{
//         console.log('RegisterUser: sendOTP: Email id found and OTP to be sent!');
//     }

//     if (!registeruser.isEmailVerified) {
//       console.log('RegisterUser: sendOTP: Alert! Email is not verified, Plz verify Email and then retry', email );
//       return res.status(400).json({ message: 'Alert! Email is not verified, Plz verify Email and then retry' });
//     } 
    
//     console.log('sendOTP API: isEmailVerified: ', registeruser.isEmailVerified);

//     if (registeruser.isUserRegistered) {
//       console.log('RegisterUser: sendOTP: User is registered, proceed to login!'); 
//       return res.status(400).json({ message: 'User is registered, proceed to login!' });
//     }

//     // Update email_otp in database
//     registeruser.email_otp = email_otp;
//     registeruser.isEmailVerified = false; // Set to disable recalling of send otpp api again
//     await registeruser.save();

//     console.log("RegisterUser: sendOTP: Email OTP updated: ", email_otp);

//     await sendEmailOTP(email, email_otp);
//     res.status(200).json({ message: "OTP sent to email successfully" });
//   } catch (err) {
//     console.error('send Email OTP ', err);
//     res.status(400).json({ error: err.message });
//   }
// };


// //Verify email otp if the email is not registered

// exports.verifyEmailOTP = async (req, res) => {
//   try {
//     const regd_mobile_no = req.body.leader_regd_mobile_no; 
//     const email = req.body.user_email_id;
//     const otp = req.body.otp;

//     console.log('RegisterUser: verifyEmailOTP: Request Body:', regd_mobile_no, ', ', email);

//     if (!regd_mobile_no || !email || !otp) {
//       console.log('Missing Body Params: leader_regd_mobile_no / user_email_id / otp required');
//       return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / user_email_id / otp required' });
//     }


//     const registeruser = await Registeruser.findOne({
//       leader_regd_mobile_no : regd_mobile_no,
//       user_email_id: email.toLowerCase().trim() 
//     });

//     if (!registeruser) {
//       console.log('RegisterUser: verifyEmailOTP: Email id is not found');
//       return res.status(404).json({ message: 'Email id is not found' });
//     }

//     if (registeruser.isUserRegistered) {
//       console.log('RegisterUser: verifyEmailOTP: User is already registered, proceed to login!');
//       return res.status(400).json({ message: 'User is already registered, proceed to login!' });
//     }

//     if (!registeruser.email_otp) {
//       console.log('Alert! Email OTP is not found, Plz call Send Email OTP API & retry', email );
//       return res.status(400).json({ message: 'Alert! Email OTP is not found, Plz send email OTP and  then retry' });
//     }

//     // Check OTP
//     if (registeruser.email_otp !== otp) {
//       console.log('RegisterUser: verifyEmailOTP: Invalid OTP, Try again!');
//       return res.status(400).json({ message: 'Invalid OTP, Try again!' });
//     }

//     // let action = "otp";
//     // await sendGreeting(email, action);

// const encryptedMobile = CryptoService.encrypt(regd_mobile_no);

// const owner = await AppOwner.findOne({
//   client_regd_mobile_no: encryptedMobile
// });

// if (!owner) {
//   return res.status(404).json({ message: 'AppOwner not found' });
// }

// let action = "otp";

// await sendGreeting(
//   email,
//   action,
//   owner.client_name,
//   owner.client_app_name
// );

//     // Mark email otp verified = true/ verified
//     registeruser.isEmailOTPVerified = true;
//     registeruser.email_otp = '1a2b3c'; // Update as null to disable recalling the api without sequence
//     await registeruser.save();
      
//     console.log('RegisterUser: verifyEmailOTP: Email verified and greeted!');
//     res.status(200).json({ message: 'Email verified and greeted!' });

//   } catch (err) {
//     console.error("RegisterUser: verifyEmailOTP: Email OTP verification error:", err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };



// // Register a new user for a given leader_regd_mobile_no
//  exports.register = async (req, res) => {

//   let status_code = 400;
//   try {
//     // Add these logs here
//     //console.log('User module type:', typeof User);
//     //console.log('Is create available?', typeof User.create);
//     console.log('Request Body:', req.body);
//     console.log('Request File:', req.file);

//     const { leader_regd_mobile_no, user_email_id, password, name, mobile, profile_image, address, city, district, state, pincode, facebook, twitter, instagram } = req.body;

//     if ( !leader_regd_mobile_no || !user_email_id || !password || !name || !mobile || !address || !district || !state || !pincode ) {
//       return res.status(400).json({ message: 'Missing params, check and try again' });
//     }

//     const registeruser = await Registeruser.findOne({
//       leader_regd_mobile_no : leader_regd_mobile_no,
//       user_email_id: user_email_id.toLowerCase().trim() 
//     });

//     if (!registeruser) {
//       console.log('RegisterUser: register API: Email id is not verified!');
//       return res.status(404).json({ message: 'Email id is not verified!' });
//     }

//     if (registeruser.isUserRegistered) {
//       console.log('RegisterUser: register API: User is already registered, proceed to login!');
//       return res.status(400).json({ message: 'User is already registered, proceed to login!' });
//     }

//     if (!registeruser.isEmailOTPVerified) {
//       console.log('Alert! Email OTP is not verified, Plz call VerifyEmail OTP API & retry', user_email_id );
//       return res.status(400).json({ message: 'Alert! Email OTP is not verifies, Plz send email OTP and  then retry' });
//     }

//     // Update the email otp verified = false in registerusers db
//     registeruser.isEmailOTPVerified = false;  // Update false to avoid calling forgot password api directly
//     await registeruser.save();

//     // All checks done, proceed to register the user in user db
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const user = await User.create({
//       leader_regd_mobile_no: leader_regd_mobile_no,
//       user_email_id: user_email_id.toLowerCase().trim(),
//       password: hashedPassword,
//       name,
//       mobile,
//       profile_image,
//       address,
//       city,
//       district,
//       state,
//       pincode,
//       facebook,
//       twitter,
//       instagram
//     });

    
//     if (registeruser) {
//       registeruser.isUserRegistered = true;
//       user.isEmailOTPVerified = false;  // Update false to avoid calling forgot password api directly
//       await registeruser.save();
//       console.log("isUserRegistered status updated.");
//     } else {
//       console.warn("Registeruser not found for email:", user_email_id);
//     }

//     // let action = "registered";
//     // await sendGreeting(user_email_id, action );    
    
// const encryptedMobile = CryptoService.encrypt(leader_regd_mobile_no);

// const owner = await AppOwner.findOne({
//   client_regd_mobile_no: encryptedMobile
// });

// if (!owner) {
//   return res.status(404).json({ message: 'AppOwner not found' });
// }

// let action = "registered";

// await sendGreeting(
//   user_email_id,
//   action,
//   owner.client_name,
//   owner.client_app_name
// );

//     return res.status(200).json({ message: 'Congrats! User registered successfully', email: user_email_id });
//   } catch (err) {
//       console.error('Register Error:', err);
//       let message = err.message;
//       status_code = 500;

//       if (err.code === 11000) {
//         console.error('Error Code:', err.code, ' Error Message', err.message);
//         status_code = 409;
//         message = "Email Id already registered, please proceed to Login!";
//       } 
//       return res.status(status_code).json({ message });
//     }
// };

// // Login to app of a given leader_regd_mobile_no
// exports.login = async (req, res) => {
//   try {

//     const regd_mobile_no = req.body.leader_regd_mobile_no; 
//     const email = req.body.user_email_id;
//     console.log('login API: Request Body:', regd_mobile_no, ', ', email);

//     if (!regd_mobile_no || !email) {
//       return res.status(400).json({ message: 'Missing Body Params: leader_regd_mobile_no / Email is required' });
//     }

//     const password = req.body.password;

//     const user = await User.findOne({
//       leader_regd_mobile_no : regd_mobile_no,
//       user_email_id: email.toLowerCase().trim() 
//     });
    
//     if (!user ) {
//       console.log('login API: User Email id is not found / not verified');
//       return res.status(400).json({ message: 'User not found or not verified' });
//     }

//     const userId = user._id;

//     console.log('User._id extracted: ', userId);

//     /*  Commented on 29 June to allow parallel sessions for a user

//     // Check if user is already logged in, then dont login again
//     const result = await RefreshToken.findOne({ userId });
//     if (result ) 
//       return res.status(401).json({ message: 'Unauthorized! User already logged in.' });

//     */

//     // User is not logged in so proceed to login
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

//     console.log('user_id fetched: ', user._id);

//     //const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
//     const accessToken = jwt.sign(
//       { userId: user._id }, 
//       process.env.JWT_SECRET, 
//       { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
//     );
    
//     //const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
//     const refreshToken = jwt.sign(
//       { userId: user._id }, 
//       process.env.REFRESH_SECRET, 
//       { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
//     );

//     /* Commented on 29th June to allow parallel logins
//     await RefreshToken.create({
//       token: refreshToken,
//       userId: user._id,
//       expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//     });
//     */

//     console.log('login API: User Email id authenticated and logged in!');
//     res.status(200).json({ accessToken, refreshToken });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };



// // Refresh Token
// exports.refreshToken = async (req, res) => {
//   try {
//     console.log('refreshToken API: req.body: ', req.body);

//     const token = req.body.refresh_token;
//     if (!token) return res.status(403).json({ message: 'Refresh token required' });

//     const stored = await RefreshToken.findOne({ token });
//     if (!stored) return res.status(403).json({ message: 'Token invalid or expired' });

//     const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

//     console.log('refreshToken API: Decoded data: ', decoded);

//     const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

//     //const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '480m' });
//     //const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

//     res.status(200).json({ accessToken });
//   } catch (err) {
//     console.log('refreshToken API: ', err);
//     res.status(403).json({ message: 'Token verification failed' });
//   }
// };

// //  Logout
// exports.logout = async (req, res) => {
//   try {
//     const refresh_token  = req.body.refresh_token;

//     console.log("logout: Headers:", req.headers);
//     console.log("logout: Body:", req.body);

//     console.log("logout: Refresh Token received: ", refresh_token);

//     if (!refresh_token) {
//       return res.status(400).json({ message: 'Refresh token is required' });
//     }
    

//     if (typeof refresh_token !== 'string' || refresh_token.length < 20) {
//       return res.status(400).json({ message: 'Invalid refresh token format' });
//     }

//     // Delete refreshToken from MongoDB
//     const token = refresh_token;
//     const result = await RefreshToken.deleteOne({ token });
  
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: 'Refresh token not found or already invalidated' });
//     }
//     return res.status(200).json({ message: 'Logged out successfully' });
//   } catch (err) {
//     console.error('Logout error:', err);
//     return res.status(400).json({ message: 'Logout failed', error: err.message });
//   }
// };












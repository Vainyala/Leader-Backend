// // models/User.js

const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  user_email_id: { type: String, required: true },
  name: String,
  mobile: String,
  profile_image: String,
  address: String,
  city: String,
  district: String,
  state: String,
  pincode: String,
  facebook: String,
  twitter: String,
  instagram: String,
  password: String,
  email_otp: String,
  user_type: { type: String, required: true, enum: ['admin', 'user'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  isEmailOTPVerified: { type: Boolean, default: false },
  fcm_token: {type: String,default: null},
}, 
{
  timestamps: { currentTime: getISTDate }
});

// Compound unique index: email must be unique per leader
userSchema.index({ leader_regd_mobile_no: 1, user_email_id: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;







// const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   leader_regd_mobile_no: { type: String, required: true },
//   user_email_id: { type: String, required: true },
//   name: String,
//   mobile: String,
//   profile_image: String,
//   address: String,
//   city: String,
//   district: String,
//   state: String,
//   pincode: String,
//   facebook: String,
//   twitter: String,
//   instagram: String,
//   password: String,
//   email_otp: String,
//   isEmailVerified: { type: Boolean, default: false },
//   isEmailOTPVerified: { type: Boolean, default: false },
//   fcm_token: {type: String,default: null},
// }, 
// {
//   timestamps: { currentTime: getISTDate }
// });

// // Compound unique index: email must be unique per leader
// userSchema.index({ leader_regd_mobile_no: 1, user_email_id: 1 }, { unique: true });

// const User = mongoose.model('User', userSchema);

// module.exports = User;

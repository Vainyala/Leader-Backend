const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function
const mongoose = require('mongoose');

const registeruserSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  user_email_id: { type: String, required: true }, // remove unique:true here
  email_otp: String,
  isEmailVerified: { type: Boolean, default: false },
  isEmailOTPVerified: { type: Boolean, default: false },
  isUserRegistered: { type: Boolean, default: false },
}, {
  timestamps: { currentTime: getISTDate }
});

// Auto-delete if not registered within 24 hrs
registeruserSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400,
    partialFilterExpression: { isUserRegistered: false }
  }
);

// Compound unique index: email must be unique per leader
registeruserSchema.index(
  { leader_regd_mobile_no: 1, user_email_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('Registeruser', registeruserSchema);

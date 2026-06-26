const mongoose = require('mongoose');
const LeaderCoordinates = mongoose.model('LeaderCoordinates'); // Ensure this is registered
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const socialMediaSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, unique: true },
  facebook: String,
  twitter: String,
  linkedin: String,
  instagram: String
}, 
  {
   timestamps: { currentTime: getISTDate }
  });

// Pre-save hook to enforce referential integrity
socialMediaSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('LeaderSocialMedia', socialMediaSchema);

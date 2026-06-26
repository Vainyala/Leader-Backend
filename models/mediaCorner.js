const mongoose = require('mongoose');
const LeaderCoordinates = require('./LeaderCoordinates');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const mediaCornerSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  media_header: String,
  media_narration: String,
  media_url: String,
  media_type: String,
  media_file: String,
  media_timestamp: String,
}, { 
  timestamps: { currentTime: getISTDate } 
});

// Referential integrity check
mediaCornerSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('mediaCorner', mediaCornerSchema);

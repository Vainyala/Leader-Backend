// models/LeaderTimeline.js
// Date: 12 Aug 2025
// Author: Suresh Gupta
// Place: Ghaziabad

const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function
const LeaderCoordinates = mongoose.model('LeaderCoordinates'); // Ensure this is registered

const timelineEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  title: { type: String, required: true },
  title_details: { type: String },
  additional_info: { type: String },
},{
  timestamps: { currentTime: getISTDate }
});

// timestamp: { type: Date, default: Date.now, immutable: true },

const leaderTimelineSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true, unique: true },
  timeline: [timelineEntrySchema]
}, { 
    timestamps: { currentTime: getISTDate }
  });

// 🔐 Referential integrity check
leaderTimelineSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('LeaderTimeline', leaderTimelineSchema);



// Pre-save hook to enforce referential integrity
leaderTimelineSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('LeaderTimeline', leaderTimelineSchema);

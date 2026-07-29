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
  user_input: { type: String, enum: ['Yes', 'No'], default: 'No' },   // NEW
  custom_text: { type: String, default: null },                       // NEW (btn name)
  media_timestamp: String,
}, {
  timestamps: { currentTime: getISTDate }
});

mediaCornerSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }

  // NEW: LN + user_input=yes requires a non-empty custom_text
  if (this.media_type === 'LN' && this.user_input === 'yes' && (!this.custom_text || !this.custom_text.trim())) {
    return next(new Error('custom_text is required when media_type is LN and user_input is yes'));
  }

  next();
});
module.exports = mongoose.model('mediaCorner', mediaCornerSchema);














// const mongoose = require('mongoose');
// const LeaderCoordinates = require('./LeaderCoordinates');
// const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

// const mediaCornerSchema = new mongoose.Schema({
//   leader_regd_mobile_no: { type: String, required: true },
//   media_header: String,
//   media_narration: String,
//   media_url: String,
//   media_type: String,
//   media_file: String,
//   media_timestamp: String,

// }, { 
//   timestamps: { currentTime: getISTDate } 
// });

// // Referential integrity check
// mediaCornerSchema.pre('save', async function (next) {
//   const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
//   if (!exists) {
//     return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
//   }
//   next();
// });

// module.exports = mongoose.model('mediaCorner', mediaCornerSchema);

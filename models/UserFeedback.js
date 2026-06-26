const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function
const LeaderCoordinates = require('./LeaderCoordinates');
const SerialTracker = require('./SerialTracker');

const UserFeedbackSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  user_email_id: { type: String, required: true },
  uf_case_no: { type: String, unique: true }, // auto-generated
  uf_subject: String,
  uf_desc: String,
  uf_type: { type: String, enum: ['feedback', 'bug'], default: 'feedback' },
  uf_attachment: String,
  uf_status: { type: String, default: 'Open' },
  uf_action_taken_comments: { type: String, default: '' },
  updated_by: { type: String, default: '' },
}, { 
  timestamps: { currentTime: getISTDate }
});


// Referential integrity check
UserFeedbackSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});


// Auto-generate case_no before saving
UserFeedbackSchema.pre('save', async function (next) {
  if (this.uf_case_no) return next();

  try {
    let tracker = await SerialTracker.findOne({ key: 'uf' });

    if (!tracker) {
      tracker = await SerialTracker.create({ key: 'uf', last_serial: 100 });
    }

    tracker.last_serial += 1;
    await tracker.save();

    this.uf_case_no = `uf${tracker.last_serial}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('userFeedback', UserFeedbackSchema);

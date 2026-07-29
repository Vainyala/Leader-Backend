const mongoose = require('mongoose');
const { getISTDate } = require('../utils/helperFunctions');

const leaderSplashMsgAnnouncementSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  media_corner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'mediaCorner', required: true },

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // keep for traceability
  user_email_id: { type: String, required: true },
  user_mobile_no: { type: String, required: true },
  name: String,
  profile_image: String,
  address: String,
  city: String,
  district: String,
  state: String,
  pincode: String,

  location: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
button_text: {
  type: String
},
}, {
  timestamps: { currentTime: getISTDate } // createdAt = click timestamp
});

module.exports = mongoose.model('leader_splash_msg_announcement', leaderSplashMsgAnnouncementSchema);
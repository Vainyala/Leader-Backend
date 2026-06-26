const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const leaderCoordinatesSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, unique: true },
  title: String,
  leader_photo: String,
  member_name: String,
  party: String,
  constituency: String,
  state: String,
  email_id: String,
  digital_sansad_url: String
}, 
{
    timestamps: { currentTime: getISTDate }
});

module.exports = mongoose.model('LeaderCoordinates', leaderCoordinatesSchema);

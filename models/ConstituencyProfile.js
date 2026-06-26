const mongoose = require('mongoose');
const LeaderCoordinates = require('./LeaderCoordinates');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const constituencyProfileSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true, unique: true },
  const_no: String,
  constituency_type: String,
  const_name: String,
  district: String,
  state: String,
  constituency_map: String,
  established: String,
  overview: String,
  sitting_member: String,
  member_image: String,
  member_party: String,
  election_year: String,
  electon_header: String,
  geography: String,
  eci_lablel: String,
  eci_url: String,
  reservation_status: String,
  assembly_segment_count: String,
  polling_station_label: String,
  polling_station_count: String,
  electors_breakups_label: String,
  electors_general_label: String,
  electors_general_male_data: String,
  electors_general_female_data: String,
  electors_general_tg_data: String,
  electors_general_total_data: String,
  electors_overseas_label: String,
  electors_overseas_male_data: String,
  electors_overseas_female_data: String,
  electors_overseas_tg_data: String,
  electors_overseas_total_data: String,
  electors_service_label: String,
  electors_service_male_data: String,
  electors_service_female_data: String,
  electors_service_tg_data: String,
  electors_service_total_data: String,
  electors_total_male_data: String,
  electors_total_female_data: String,
  electors_total_tg_data: String,
  electors_grand_total_data: String,
  avg_no_electors_per_ps_label: String,
  avg_no_electors_per_ps_data: String,
  total_no_voters_label: String,
  total_no_voters_data: String,
  voter_trunout_ratio_label: String,
  voter_trunout_ratio_data: String,
  wikipedia_url: String,
  chanakya_url: String
}, 
  {
    timestamps: { currentTime: getISTDate}
});

// Referential integrity check
constituencyProfileSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('ConstituencyProfile', constituencyProfileSchema);

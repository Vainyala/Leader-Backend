const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function
const LeaderCoordinates = mongoose.model('LeaderCoordinates'); // Ensure this is registered

const personalDetailsSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, unique: true },
  birth_place: String,
  dob: String,
  father_name: String,
  mother_name: String,
  profession: String
}, 
  {
    timestamps: { currentTime: getISTDate }
});


// Pre-save hook to enforce referential integrity
personalDetailsSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ regd_mobile_no: this.regd_mobile_no });
  if (!exists) {
    return next(new Error(`regd_mobile_no ${this.regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('LeaderPersonalDetails', personalDetailsSchema);


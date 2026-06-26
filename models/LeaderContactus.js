const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const LeaderCoordinates = mongoose.model('LeaderCoordinates'); // Ensure this is registered

const contactusSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, unique: true },
  const_off_address1: String,
  const_off_address2: String,
  const_off_address3: String,
  const_off_pincode: String,
  const_off_state: String,
  const_off_isd_code: String,
  const_off_std_code: String,
  const_off_tel_number1: String,
  const_off_mobile_number1: String,
  const_off_tel_number2: String,
  const_off_mobile_number2: String,
  capital_off_address1: String,
  capital_off_address2: String,
  capital_off_address3: String,
  capital_off_pincode: String,
  capital_off_state: String,
  capital_off_isd_code: String,
  capital_off_isd_code: String,
  capital_off_std_code: String,
  capital_off_tel_number1: String,
  capital_off_mobile_number1: String,
  capital_off_tel_number2: String,
  capital_off_mobile_number2: String
}, 
{
    timestamps: { currentTime: getISTDate }
});



// Pre-save hook to enforce referential integrity
contactusSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('Contactus', contactusSchema);


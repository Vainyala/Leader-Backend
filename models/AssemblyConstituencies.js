const mongoose = require('mongoose');
const LeaderCoordinates = require('./LeaderCoordinates');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const assemblySchema = new mongoose.Schema({
  ac_number: Number,
  ac_name: String,
  district: String
});

const assemblyConstituenciesSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true, unique: true },
  narration: String,
  assembly_const_count: Number,
  assembly_const: [assemblySchema]
}, { 
  timestamps: { currentTime: getISTDate}
});

// Referential integrity check
assemblyConstituenciesSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
  if (!exists) {
    return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('AssemblyConstituencies', assemblyConstituenciesSchema);

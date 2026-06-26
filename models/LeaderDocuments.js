const mongoose = require('mongoose');
const LeaderCoordinates = require('./LeaderCoordinates');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const leaderDocumentSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  document_header: String,
  document_narration: String,
  document_url: String,
  document_type: String,
  document_file: String,
  document_timestamp: String,
}, 
{
    timestamps: { currentTime: getISTDate }
});


// Referential integrity check
leaderDocumentSchema.pre('save', async function (next) {
  const exists = await LeaderCoordinates.findOne({ regd_mobile_no: this.regd_mobile_no });
  if (!exists) {
    return next(new Error(`regd_mobile_no ${this.regd_mobile_no} not found in LeaderCoordinates`));
  }
  next();
});

module.exports = mongoose.model('leaderDocument', leaderDocumentSchema);

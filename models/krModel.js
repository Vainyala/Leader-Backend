const mongoose = require('mongoose');
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const krSchema = new mongoose.Schema({
  media_header: String,
  media_narration: String,
  media_url: String,
  media_type: String,
  media_file: String,
  media_timestamp: String,
  timestamps: true
});

module.exports = mongoose.model('knowledgerepo', krSchema);

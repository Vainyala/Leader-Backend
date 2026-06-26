// models/Pincode.js
const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function
const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true },
  postoffice: { type: String, required: true },
  district: { type: String, required: true },
  statename: { type: String, required: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 }
  }, 
  {
    timestamps: { currentTime: getISTDate }
  });

const Pincodes = mongoose.model('Pincodes', pincodeSchema);

module.exports = Pincodes;



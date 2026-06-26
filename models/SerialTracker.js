const mongoose = require('mongoose');

const SerialTrackerSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'appointment'
  last_serial: { type: Number, required: true }
});

module.exports = mongoose.model('SerialTracker', SerialTrackerSchema);


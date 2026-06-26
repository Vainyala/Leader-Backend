// models/UpdatesTrackerModel.js

const mongoose = require('mongoose');

const updatesTrackerSchema = new mongoose.Schema({
  client_regd_mobile_no: String,
  device_aaid: String,
  device_fingerprint: String,
  updatedAC: { type: Boolean, default: true },
  updatedCP: { type: Boolean, default: true },
  updatedCPImage: { type: Boolean, default: true },
  updatedCPMap: { type: Boolean, default: true },
  updatedContactus: { type: Boolean, default: true },
  updatedCoordinates: { type: Boolean, default: true },
  updatedLeaderImage: { type: Boolean, default: true },
  updatedEducation: { type: Boolean, default: true },
  updatedPermadd: { type: Boolean, default: true },
  updatedPresadd: { type: Boolean, default: true },
  updatedPersdet: { type: Boolean, default: true },
  updatedSM: { type: Boolean, default: true },
  updatedTimeline: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index on device_aaid + device_fingerprint 
updatesTrackerSchema.index({ device_aaid: 1, device_fingerprint: 1 });

module.exports = mongoose.models.UpdatesTrackerModel || mongoose.model('UpdatesTrackerModel', updatesTrackerSchema);

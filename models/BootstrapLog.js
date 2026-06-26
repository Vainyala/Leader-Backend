// /models/BootstrapLog.js

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  app_key: String,
  bootstrap_status: String,
  client_regd_mobile_no: String,
  user_email_id: String,
  device_ip_address: String,
  device_info: String,
  device_fingerprint: String,
  device_aaid: String,
  device_manufacturer_name: String,
  device_model: String,
  devce_brand_name: String,
  device_os_version: String,
  device_api_level: String,
  device_type: String,
  device_app_version: String,
  device_type_str: String,
  deice_os_codename: String,
  device_screen_density: String,
  device_data_refresh: { type: Boolean, default: true }
});

// Compound index on device_aaid + device_fingerprint 
schema.index({ device_aaid: 1, device_fingerprint: 1 });

module.exports = mongoose.model('BootstrapLog', schema);

/*
Create Index manually
db.bootstraplogs.createIndex({ device_aaid: 1 });

*/
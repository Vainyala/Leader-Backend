const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  leader_regd_mobile_no: String,
  user_email_id: String,
  device_ip_address: String,
  device_user_agent: String,
  device_fingerprint: String,
  device_aaid: String,
  device_manufacturer_name: String,
  device_model: String,
  device_brand_name: String,
  device_os_version: String,
  device_api_level: String,
  device_type: String,
  device_app_version: String,
  device_type_str: String,
  device_os_codename: String,
  device_screen_density: String
},{
    timestamps: { currentTime: getISTDate }
});

module.exports = mongoose.model('DeviceInfo', schema);
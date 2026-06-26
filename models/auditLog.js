const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  action: { type: String, required: true }, // e.g., Uploaded, Deleted, Updated
  filename: { type: String },
  field: { type: String }, // e.g., memebr_image, constituency_map
  user_id: { type: String }, // Optional: from req.user or req.headers
  request_id: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);


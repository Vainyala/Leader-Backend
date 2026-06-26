const mongoose = require('mongoose');

const auditLogArchiveSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  action: { type: String, required: true },
  filename: { type: String },
  field: { type: String },
  user_id: { type: String },
  request_id: { type: String },
  timestamp: { type: Date, default: Date.now },
  archived_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLogArchive', auditLogArchiveSchema);


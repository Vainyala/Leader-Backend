const logger = require('./logger');
const AuditLog = require('../models/auditLog');

exports.logFileChange = async ({ regd_mobile_no, action, filename, field, requestId, userId }) => {
  try {
    const entry = new AuditLog({
      regd_mobile_no,
      action,
      filename,
      field,
      request_id: requestId,
      user_id: userId || 'system'
    });

    await entry.save();
    logger.info(`[${requestId}] [Audit] ${action} '${field}' file '${filename}' for ${regd_mobile_no}`);
  } catch (err) {
    logger.error(`[${requestId}] Audit log failed: ${err.message}`);
  }
};

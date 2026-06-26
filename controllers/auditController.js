const AuditLog = require('../models/auditLog');
const AuditLogArchive = require('../models/AuditLogArchive');
const { Parser } = require('json2csv');

exports.exportAsJSON = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

exports.exportAsCSV = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).lean();
    const parser = new Parser();
    const csv = parser.parse(logs);

    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportFilteredJSON = async (req, res, next) => {
  try {
    const { user_id, action, start, end, page = 1, limit = 50 } = req.query;

    const query = {};
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ page, limit, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

exports.exportFilteredJSON = async (req, res, next) => {
  try {
    const { user_id, action, field, regd_mobile_no, start, end, page = 1, limit = 50 } = req.query;

    const query = {};
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    if (field) query.field = field;
    if (regd_mobile_no) query.regd_mobile_no = regd_mobile_no;
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ page, limit, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

exports.exportFilteredCSV = async (req, res, next) => {
  try {
    const { user_id, action, field, regd_mobile_no, start, end } = req.query;

    const query = {};
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    if (field) query.field = field;
    if (regd_mobile_no) query.regd_mobile_no = regd_mobile_no;
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).lean();
    const parser = new Parser();
    const csv = parser.parse(logs);

    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs_filtered.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// Delete a single audit log by ID
exports.deleteAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await AuditLog.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Audit log not found' });

    res.status(200).json({ message: 'Audit log deleted', id });
  } catch (err) {
    next(err);
  }
};

// Archive logs older than a given date
exports.archiveAuditLogs = async (req, res, next) => {
  try {
    const { before } = req.body;
    const cutoff = new Date(before);

    const logs = await AuditLog.find({ timestamp: { $lt: cutoff } });
    // TODO: Move logs to archive collection or file
    await AuditLog.deleteMany({ timestamp: { $lt: cutoff } });

    res.status(200).json({ message: 'Archived and deleted logs', count: logs.length });
  } catch (err) {
    next(err);
  }
};

exports.archiveAuditLogs = async (req, res, next) => {
  try {
    const { before } = req.body;
    const cutoff = new Date(before);

    const logsToArchive = await AuditLog.find({ timestamp: { $lt: cutoff } });

    if (logsToArchive.length === 0) {
      return res.status(200).json({ message: 'No logs to archive' });
    }

    const archivedLogs = logsToArchive.map(log => ({
      ...log.toObject(),
      archived_at: new Date()
    }));

    await AuditLogArchive.insertMany(archivedLogs);
    await AuditLog.deleteMany({ timestamp: { $lt: cutoff } });

    res.status(200).json({
      message: 'Archived logs to AuditLogArchive',
      archived_count: archivedLogs.length
    });
  } catch (err) {
    next(err);
  }
};


// Date: 12 Nov 2025: 12 O'Clock
// @Delhi Home

// Controller to handle logic for feedbacks/report issues tasks

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { logFileChange } = require('../utils/auditLogger');
const getDynamicQuery = require('../utils/getDynamicQuery');
const AuditLog = require('../models/auditLog');
const UserFeedback = require('../models/UserFeedback');
const DeviceInfo = require('../models/DeviceInfo');
const User = require('../models/User');
const notificationService = require('../services/notificationService');


// 🧹 Helper to delete file from disk
const deleteFile = (relativePath) => {
  const fullPath = path.join(__dirname, '..', 'uploads', 'user_feedbacks', relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.info(`Deleted file: ${relativePath}`);
  }
};


//=============================================================
exports.addUserFeedback = async (req, res) => {

  //let status_code = 400;
  try {
    console.log('addUserFeedback:-> Request Body:', req.body);


    if (!req.body.leader_regd_mobile_no || !req.body.user_email_id || 
      !req.body.uf_subject || !req.body.uf_desc || !req.body.uf_type) {
      console.log('Missing required params....');
      return res.status(404).json({ status: 'error', message: 'Alert! Missing required params....' });
    }

    const { uf_case_no, uf_attachment, ...safeData } = req.body;

    console.log('addUserFeedback: Attached File: ', uf_attachment);

    if (req.user_type === 'admin') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const newEntry = new UserFeedback({
      ...safeData,
      uf_case_no,
      uf_attachment
    });
    await newEntry.save();


    try {
      const user = await User.findOne({
        leader_regd_mobile_no: newEntry.leader_regd_mobile_no
      });

      if (user?.fcm_token) {
        await notificationService.sendNotification({
          token: user.fcm_token,
          title: "Feedback Submitted",
          body: `Your feedback ${newEntry.regn_no} has been submitted successfully.`,
          type: "feedback"
        });
      }
    } catch (notifErr) {
      console.warn(
        "Notification failed (non-blocking):",
        notifErr.message
      );
    }


    logger.info(`User Feedback added for ${newEntry.leader_regd_mobile_no}`);
    res.status(201).json({ message: 'User Feedback registered successfully' });
  } catch (err) {
    logger.error(`addUserFeedback: error: ${err.message}`);
    if (req.body.uf_attachment) deleteFile(req.body.uf_attachment); // cleanup on error
    res.status(500).json({ error: 'Internal server error' });
  }

};

exports.fetchUserFeedbacks = async (req, res, next) => {
  const { leader_regd_mobile_no, user_email_id, uf_type } = req.query;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}`;

  logger.info(`[${requestId}] fetchUserFeedbacks invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}, user_email_id: ${user_email_id}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  if (!leader_regd_mobile_no || !user_email_id || !uf_type) {
    logger.warn(`[${requestId}] Missing required query parameters`);
    return res.status(400).json({ error: 'Missing required parameters: leader_regd_mobile_no and/or user_email_id and/or uf_type' });
  }

  try {
    const { user_type } = req;

    console.log('fetchUserFeedbacks: User Type received from authenticate:', user_type);

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);

    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('fetchUserFeedbacks: Dynamic Query: ', query);
    }

    const finalQuery = { ...query, uf_type };
    console.log('Final Query:', finalQuery);

    const records = await UserFeedback.find(finalQuery).sort({ createdAt: -1 });

    console.log('Total # Documents found: ', records.length);

    //const records = await UserFeedback.find({ leader_regd_mobile_no, user_email_id });

    if (!records || records.length === 0) {
      logger.warn(`[${requestId}] User Feedback data not found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'User Feedback Data not found' });
    }

    logger.info(`[${requestId}] ${records.length} User Feedback Data fetched`);

    const updatedRecords = records.map((record) => {
      const obj = record.toObject();
      const { uf_attachment } = obj;

      if (uf_attachment && uf_attachment !== 'null') {
        obj.uf_attachment_url = `${hostUrl}/userfeedbacks/${uf_attachment}`;
        logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.uf_attachment}`);
      } else {
        obj.uf_attachment_url = 'null';
        logger.warn(`[${requestId}] Attachment is not found for record ID: ${record._id}`);
      }

      return obj;
    });

    logger.info(`[${requestId}] User Feedback Data response prepared for ${leader_regd_mobile_no}`);
    return res.status(200).json(updatedRecords);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching User Feedback Data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


// Download user Feedback Attachment
exports.downloadUserFeedbackFile = (req, res) => {
  const filename = req.query.uf_attachment;
  console.log('downloadUserFeedbackFile......', filename);
  const currentWorkingDir = process.cwd();

  const filePath = path.join(currentWorkingDir, 'uploads', 'user_feedbacks', filename);

  console.log('downloadUserFeedbackFile API:-> Final ImagePath: ', filePath);

  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error sending User feedback attchmanet file:', err.message);
      res.status(404).json({ message: 'Please check attachment not found or access denied' });
    }
  });
};



//Update User Feedback by Admin after Review
exports.updateUserFeedback = async (req, res, next) => {
  try {
    const { user_type } = req;

    console.log('User Type received from authenticate:', user_type);

    if (user_type === 'user') {
      console.log('updateUserFeedback -> user_type: user: Edit action forbidden.');
      return res.status(403).json({ error: 'Oops! You are not authorized to Edit User Feedback Data.' });
    }

    /*  Explanation of REST ... Operator for understanding
         It pulls out leader_regd_mobile_no, user_email_id, and uf_case_no from req.body.
         The rest operator (...) collects all the remaining properties of req.body into a new object called updatePayload.
         Destructuring with rest:
         This removes those identifiers from the payload automatically.
    
          Filter includes all identifiers: { leader_regd_mobile_no, user_email_id, uf_case_no }
          Update only allowed fields: { $set: updatePayload } ensures only the remaining fields are updated.
          Status codes: Use 403 for forbidden, 200 for successful update (instead of 201, which is for creation).
    */

    const { leader_regd_mobile_no, user_email_id, uf_case_no, ...updatePayload } = req.body;

    if (!leader_regd_mobile_no || !uf_case_no) {
      return res.status(400).json({ error: 'Missing required body parameters' });
    }

    console.log('updateUserFeedback: Update Filter:', { leader_regd_mobile_no, uf_case_no });
    console.log('updateUserFeedback: Update Payload:', updatePayload);

    // Only use identifiers in the filter, not in the update payload
    const updated = await UserFeedback.findOneAndUpdate(
      { leader_regd_mobile_no, uf_case_no },
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User Feedback Data not found with given identifiers' });
    }

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_USER_FEEDBACK',
      field: 'uf_case_no',
      regd_mobile_no: updated.leader_regd_mobile_no,
      timestamp: new Date()
    });

    const result = {
      message: 'Congrats! User Feedback details updated successfully',
      regn_no: updated.regn_no
    };

    res.status(200).json(result);
  } catch (err) {
    logger.error(`User Feedback update failed: ${err.message}`);
    next(err);
  }
};


// 19 Nov 2025
// APIs for Admin to manage the feedbacks/Bugs reported by Users

// API for user Feedabck Searchsearch
// endpoint:  {{base_url}}/api/userfeedback/search

exports.findUserFeedback = async (req, res) => {
  console.log("findUserFeedback:  Request Query: ", req.query);
  const requestId = req.requestId || 'N/A';
  const { leader_regd_mobile_no, user_email_id, uf_case_no } = req.query;
  const hostUrl = `${process.env.HOST_URL}`;

  console.log(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  try {
    const { user_type } = req;

    console.log('User Type received from authenticate:', user_type);

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);

    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('findUserFeedback->Dynamic Query received:', query);
    }

    const finalQuery = { ...query, uf_case_no };
    console.log('Final Query:', finalQuery);

    /*
    * When you query with , Mongoose gives you a plain JavaScript object 
    * instead of a Mongoose document. That makes it safe to add extra fields:
    */
    const data = await UserFeedback.findOne(finalQuery).lean();

    if (!data) {
      return res.status(404).json({ error: 'UserFeedback Data not found' });
    }

    data.uf_attachment_url =
      data.uf_attachment && data.uf_attachment !== 'null'
        ? `${hostUrl}/userfeedbacks/${data.uf_attachment}`
        : null;

    console.log(`[${requestId}] Attachment URL constructed: ${data.uf_attachment_url}`);

    return res.json({ data });

  } catch (error) {
    res.status(500).json(`[${requestId}] Error fetching User Feedback Data: ${error.message}`);
    //    logger.error(`[${requestId}] Error fetching User Feedback Data: ${error.message}`, { stack: error.stack });
    //  return next(error);
  }
};

// Count all uf_type=user feedback / bug - for Dashboard
//endpoint: {{base_url}}/api/userfeedback/count/

exports.countAllUserFeedback = async (req, res, next) => {
  try {

    const { user_type } = req;

    const { leader_regd_mobile_no, user_email_id, uf_type } = req.query;
    console.log('countAllUserFeedback......: Query Params:', req.query);

    if (!leader_regd_mobile_no || !user_email_id || !uf_type) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    console.log('Query Filter:', { leader_regd_mobile_no, user_email_id, uf_type });

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('countAllUserFeedback->dynamic query: ', query);
    }

    const finalQuery = { ...query, uf_type };
    console.log(' Final Query:', finalQuery);

    const entries = await UserFeedback.find(finalQuery);

    tot_no_docs = entries.length;
    console.log('Total # ', uf_type, 'found: ', tot_no_docs);

    res.status(200).json({
      message: 'Request Type:' + uf_type,
      count: tot_no_docs
    });
  } catch (err) {
    logger.error(`countAllUserFeedback API:  Fetching UserFeedback failed: ${err.message}`);
    next(err);
  }
};


// Get all UserFeedback data  by given request_type and status
exports.getAllUserFeedbackbyTypenStatus = async (req, res, next) => {

  const { user_type } = req;
  const requestId = req.requestId || 'N/A';

  const hostUrl = `${process.env.HOST_URL}`;

  logger.info(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  try {

    const { leader_regd_mobile_no, user_email_id, uf_type, uf_status } = req.query;
    console.log('Request Query Params:', req.query);

    if (!leader_regd_mobile_no || !user_email_id || !uf_type || !uf_status) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    console.log('Query Filter:', { leader_regd_mobile_no, user_email_id, uf_type, uf_status });

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('getAllUserFeedbackbyTypenStatus->dynamic query: ', query);
    }

    const finalQuery = { ...query, uf_type, uf_status };
    console.log('Final Query:', finalQuery);

    const records = await UserFeedback.find(finalQuery).sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      logger.warn(`[${requestId}] User Feedback data not found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'User Feedback Data not found' });
    }

    logger.info(`[${requestId}] ${records.length} User Feedback Data fetched`);

    const updatedRecords = records.map((record) => {
      const obj = record.toObject();
      const { uf_attachment } = obj;

      if (uf_attachment && uf_attachment !== 'null') {
        obj.uf_attachment_url = `${hostUrl}/userfeedbacks/${uf_attachment}`;
        logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.uf_attachment}`);
      } else {
        obj.uf_attachment_url = 'null';
        logger.warn(`[${requestId}] Attachment is not found for record ID: ${record._id}`);
      }

      return obj;
    });

    logger.info(`[${requestId}] User Feedback Data response prepared for ${leader_regd_mobile_no}`);
    return res.status(200).json(updatedRecords);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching User Feedback Data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


// Get count of all UserFeedback by request_type and status - for Dashboard
exports.countAllUserFeedbackbyStatus = async (req, res, next) => {
  try {
    const { user_type } = req;
    const { leader_regd_mobile_no, user_email_id, uf_type, uf_status } = req.query;

    console.log('Request Query Params:', req.query);

    if (!leader_regd_mobile_no || !user_email_id || !uf_type || !uf_status) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    }

    const finalQuery = { ...query, uf_type, uf_status };
    console.log('Final Query:', finalQuery);

    const entries = await UserFeedback.find(finalQuery);
    const count = entries.length;

    console.log('Total UserFeedback found:', count);

    res.status(200).json({
      message: `UF Type: ${uf_type}, Status: ${uf_status}`,
      count: count
    });
  } catch (err) {
    logger.error(`Fetching UserFeedback failed: ${err.stack}`);
    next(err);
  }
};

// Delete an UserFeedback using leader_regd_mobile_no, user_email_id, and regn_no
exports.deleteUserFeedback = async (req, res, next) => {
  try {

    const { user_type } = req;

    console.log('deleteUserFeedback->User Type received from authenticate:', user_type);

    if (user_type === 'user') {
      console.log('deleteUserFeedback -> user_type: user: Edit action forbidden.');
      return res.status(201).json('Oops! Ypu are not authorized to Delete Request.');
    }

    const { leader_regd_mobile_no, user_email_id, uf_case_no } = req.query;

    if (!leader_regd_mobile_no || !user_email_id || !uf_case_no) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    console.log('Delete Filter:', { leader_regd_mobile_no, user_email_id, uf_case_no });

    const deleted = await UserFeedback.findOneAndDelete({
      leader_regd_mobile_no,
      uf_case_no
    });

    if (!deleted) {
      return res.status(404).json({ error: 'User Feedback data not found with given identifiers', uf_case_no });
    }

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'DELETE_UserFeedback',
      field: 'uf_case_no',
      regd_mobile_no: deleted.leader_regd_mobile_no,
      timestamp: new Date()
    });

    res.status(200).json({
      message: 'User Feedback Data deleted successfully',
      uf_case_no: deleted.uf_case_no
    });
  } catch (err) {
    logger.error(`UserFeedback deletion failed: ${err.message}`);
    next(err);
  }
};


// 20/11/2025
// Capture device info if an User reports a Technical Issue
exports.deviceInfo = async (req, res, next) => {
  try {
    if (req.user_type === 'admin') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const useragent = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
    let fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

    if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
      fingerprint = 'invalid-format';
    }

    const payload = {
      ...req.body,
      device_ip_address: ip,
      device_user_agent: useragent,
      device_fingerprint: fingerprint
    };

    logger.info('DeviceInfo: Upserting payload', payload);

    const result = await upsertDeviceInfo(payload);

    logger.info('DeviceInfo: Upsert successful', result?.toObject());

    return res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    logger.error(`DeviceInfo: Upsert failed`, { error: err.message });
    return next(err);
  }
};

// Upsert device info by leader_regd_mobile_no and user_email_id
async function upsertDeviceInfo(payload) {
  const { leader_regd_mobile_no, user_email_id, ...deviceData } = payload;

  console.log('deviceInfo: devideData:', deviceData);

  if (!leader_regd_mobile_no || !user_email_id) {
    throw new Error('Missing required identifiers: leader_regd_mobile_no or user_email_id');
  }

  const filter = { leader_regd_mobile_no, user_email_id };
  const update = { $set: deviceData };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  return await DeviceInfo.findOneAndUpdate(filter, update, options);
}


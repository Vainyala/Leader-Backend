const AppGrievComp = require('../models/AppGrievComp');
const AuditLog = require('../models/auditLog');
const logger = require('../utils/logger');
const getDynamicQuery = require('../utils/getDynamicQuery');
const User = require('../models/User');
const notificationService = require('../services/notificationService');


exports.createAppGrievComp = async (req, res, next) => {
  try {

    const { user_type } = req;

    console.log('createAppGrievComp-> User Type received from authenticate:', user_type);

    if (user_type === 'admin') {
      console.log('createAppointment -> user_type: admin: Request cant be created');
      return res.status(201).json('Oops! Login as Normal User to Raise a Request.');
    }

    console.log('Grievance Request Body:', req.body);
    let result = '';

    const { regn_no, ...safeData } = req.body;

    const newEntry = new AppGrievComp(safeData);
    await newEntry.save(); // triggers regn_no generation

    try {
      const user = await User.findOne({
        leader_regd_mobile_no: newEntry.leader_regd_mobile_no
      });

      if (user?.fcm_token) {
        await notificationService.sendNotification({
          token: user.fcm_token,
          title: "Grievance Submitted",
          body: `Your grievance ${newEntry.regn_no} has been submitted successfully.`,
          type: "grievance"
        });
      }
    } catch (notifErr) {
      console.warn(
        "Notification failed (non-blocking):",
        notifErr.message
      );
    }

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CREATE_GRIEVANCE',
      field: 'regn_no',
      leader_regd_mobile_no: newEntry.leader_regd_mobile_no,
      timestamp: new Date()
    });


    //    result = 'Congrates! Your '+req.body.request_type+' registered successfully Vide Regn# '+newEntry.regn_no;
    result = {
      message: 'Congrats! Your ' + req.body.request_type + ' registered successfully',
      regn_no: newEntry.regn_no
    };
    res.status(201).json(result);
  } catch (err) {
    logger.error(`Grievance creation failed: ${err.message}`);
    res.status(500).json({
      error: 'Server error',
      details: err.message,
      requestId: req.headers['x-request-id'] || 'N/A'
    });
  }
};

exports.getAllAppGrievComp = async (req, res, next) => {
  try {
    console.log('getAllAppGrievCompController: Request Query Params:', req.body);

    const { leader_regd_mobile_no, user_email_id } = req.query;
    console.log('getAllAppGrievCompController: Query Filter:', { leader_regd_mobile_no, user_email_id });

    const { user_type } = req;

    console.log('getAllAppGrievComp: User Type received from authenticate:', user_type);

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);

    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('getAllAppointments: Dynamic Query: ', query);
    }

    const entries = await AppGrievComp.find(query).sort({ createdAt: -1 });
    const no_docs = entries.length;

    console.log('Total # Documents found: ', no_docs);

    res.status(200).json(entries);
  } catch (err) {
    logger.error(`Fetching grievances failed: ${err.message}`);
    next(err);
  }
};


// Routes: appi/appointments/search
exports.findAppGrievComp = async (req, res) => {
  console.log("findAppGrievComp:  Request Query: ", req.query);
  const { leader_regd_mobile_no, user_email_id, regn_no } = req.query;

  try {
    const { user_type } = req;

    console.log('User Type received from authenticate:', user_type);

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);

    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('findAppointment->Dynamic Query received:', query);
    }

    const finalQuery = { ...query, regn_no };
    console.log(' Final Query:', finalQuery);

    const data = await AppGrievComp.findOne(finalQuery);

    if (!data) {
      return res.status(404).json({ error: 'AppGrievComp not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


// Update an AppGrievComp for a given leader_regd_mobile_no, user_email_id and regn_no
exports.updateAppGrievComp = async (req, res, next) => {
  try {
    const { user_type } = req;

    console.log('updateAppGrievComp -> User Type received from authenticate:', user_type);

    if (user_type === 'user') {
      console.log('updateAppGrievComp -> user_type: user: Edit action forbidden.');
      return res.status(201).json('Oops! Ypu are not authorized to Edit Request.');
    }

    let result = '';

    const { leader_regd_mobile_no, user_email_id, regn_no, ...updatePayload } = req.body;

    if (!leader_regd_mobile_no || !user_email_id || !regn_no) {
      return res.status(400).json({ error: 'Missing required body parameters' });
    }

    console.log('Update Filter:', { leader_regd_mobile_no, regn_no });
    console.log('Update Payload:', updatePayload);

    const updated = await AppGrievComp.findOneAndUpdate(
      { leader_regd_mobile_no, regn_no },
      { $set: updatePayload },
      { new: true }
    );

    try {

      const user = await User.findOne({
        leader_regd_mobile_no: updated.leader_regd_mobile_no
      });

      if (user?.fcm_token) {

        let title = "Grievance Updated";
        let body = `Your grievance ${updated.regn_no} has been updated`;

        if (updated.status === "APPROVED") {
          title = "Grievance Approved";
          body = `Your grievance ${updated.regn_no} has been approved`;
        }

        if (updated.status === "REJECTED") {
          title = "Grievance Rejected";
          body = `Your grievance ${updated.regn_no} has been rejected`;
        }

        if (req.body.admin_comments) {
          title = "New Comment Added";
          body = `Admin added a comment on grievance ${updated.regn_no}`;
        }

        await notificationService.sendNotification({
          token: user.fcm_token,
          title,
          body,
          type: "grievance_update"
        });
      }

    } catch (notifErr) {
      console.warn(
        "Notification failed:",
        notifErr.message
      );
    }

    if (!updated) {
      return res.status(404).json({ error: 'AppGrievComp not found with given identifiers' });
    }

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_AppGrievComp',
      field: 'regn_no',
      leader_regd_mobile_no: updated.leader_regd_mobile_no,
      timestamp: new Date()
    });

    //result = 'Congrates! '+updated.request_type+' details updated successfully Vide Regn# '+updated.regn_no;
    result = {
      message: 'Congrates! ' + updated.request_type + ' details updated successfully',
      regn_no: updated.regn_no
    };
    res.status(201).json(result);
    //res.status(200).json(updated);
  } catch (err) {
    logger.error(`AppGrievComp update failed: ${err.message}`);
    next(err);
  }
};


// Delete an AppGrievComp using leader_regd_mobile_no, user_email_id, and regn_no
exports.deleteAppGrievComp = async (req, res, next) => {
  try {

    const { user_type } = req;

    console.log('deleteAppGrievComp->User Type received from authenticate:', user_type);

    if (user_type === 'user') {
      console.log('deleteAppGrievComp -> user_type: user: Edit action forbidden.');
      return res.status(201).json('Oops! Ypu are not authorized to Delete Request.');
    }

    const { leader_regd_mobile_no, user_email_id, regn_no } = req.query;

    if (!leader_regd_mobile_no || !user_email_id || !regn_no) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    console.log('Delete Filter:', { leader_regd_mobile_no, user_email_id, regn_no });

    const deleted = await AppGrievComp.findOneAndDelete({
      leader_regd_mobile_no,
      regn_no
    });

    if (!deleted) {
      return res.status(404).json({ error: 'AppGrievComp not found with given identifiers' });
    }

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'DELETE_AppGrievComp',
      field: 'regn_no',
      leader_regd_mobile_no: deleted.leader_regd_mobile_no,
      timestamp: new Date()
    });

    res.status(200).json({
      message: deleted.request_type + ' deleted successfully',
      regn_no: deleted.regn_no
    });
  } catch (err) {
    logger.error(`AppGrievComp deletion failed: ${err.message}`);
    next(err);
  }
};


// Get count of all request_type=appeal/grievances/complaints - for Dashboard
exports.countAllAppGrievComp = async (req, res, next) => {
  try {

    const { user_type } = req;

    const { leader_regd_mobile_no, user_email_id, request_type } = req.query;
    console.log('Request Query Params:', req.query);

    if (!leader_regd_mobile_no || !user_email_id || !request_type) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    console.log('Query Filter:', { leader_regd_mobile_no, user_email_id, request_type });

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    } else {
      console.log('countAllAppGrievComp->dynamic query: ', query);
    }

    const finalQuery = { ...query, request_type };
    console.log(' Final Query:', finalQuery);

    const entries = await AppGrievComp.find({
      finalQuery
    }).sort({ createdAt: -1 });

    tot_no_docs = entries.length;
    console.log('Total # ', request_type, 'found: ', tot_no_docs);

    res.status(200).json({
      message: 'Request Type:' + request_type,
      count: tot_no_docs
    });
  } catch (err) {
    logger.error(`Fetching Appointments failed: ${err.message}`);
    next(err);
  }
};


// Get count of all appGrievComp by request_type and status - for Dashboard
exports.countAllAppGrievCompbyStatus = async (req, res, next) => {
  try {
    const { user_type } = req;
    const { leader_regd_mobile_no, user_email_id, request_type, status } = req.query;

    console.log('Request Query Params:', req.query);

    if (!leader_regd_mobile_no || !user_email_id || !request_type || !status) {
      return res.status(400).json({ error: 'Missing required body parameters' });
    }

    const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
    if (!query) {
      return res.status(403).json({ message: 'Unauthorized user type' });
    }

    const finalQuery = { ...query, request_type, status };
    console.log('Final Query:', finalQuery);

    const entries = await AppGrievComp.find(finalQuery);
    const count = entries.length;

    console.log('Total AppGrievComp found:', count);

    res.status(200).json({
      message: `Request Type: ${request_type}, Status: ${status}`,
      count: count
    });
  } catch (err) {
    logger.error(`Fetching AppGrievComp failed: ${err.stack}`);
    next(err);
  }
};

// Get all appeal/grievance/complaints data  by given request_type and status
exports.getAllAppGrievCompbyTypenStatus = async (req, res, next) => {
  try {
    const { user_type } = req;

    const {
      leader_regd_mobile_no,
      user_email_id,
      request_type,
      status
    } = req.query;

    console.log('Request Query Params:', req.query);

    // ---------------------------------------------------------
    // Required parameters
    // ---------------------------------------------------------

    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !request_type
    ) {
      return res.status(400).json({
        error:
          'leader_regd_mobile_no, user_email_id and request_type are required'
      });
    }

    console.log('Query Filter:', {
      leader_regd_mobile_no,
      user_email_id,
      request_type,
      status
    });

    // ---------------------------------------------------------
    // Dynamic user query
    // ---------------------------------------------------------

    const query = getDynamicQuery(
      user_type,
      leader_regd_mobile_no,
      user_email_id
    );

    if (!query) {
      return res.status(403).json({
        message: 'Unauthorized user type'
      });
    }

    // ---------------------------------------------------------
    // Build final query
    // ---------------------------------------------------------

    const finalQuery = {
      ...query,
      request_type
    };

    // IMPORTANT:
    // Only add status when it is actually provided.
    //
    // If status is NOT provided:
    //     Appeal     -> all Appeal records
    //     Grievance  -> all Grievance records
    //     Complaints -> all Complaints records
    //
    // If status is provided:
    //     Appeal + Open -> only Open Appeals
    //     Appeal + Resolved -> only Resolved Appeals
    // etc.

    if (
      status !== undefined &&
      status !== null &&
      String(status).trim() !== ''
    ) {
      finalQuery.status = String(status).trim();
    }

    console.log('📄 Final Query:', finalQuery);

    // ---------------------------------------------------------
    // Fetch records
    // ---------------------------------------------------------

    const entries = await AppGrievComp
      .find(finalQuery)
      .sort({ createdAt: -1 });

    const no_docs = entries.length;

    console.log(
      'Total # Documents found:',
      no_docs
    );

    return res.status(200).json(entries);

  } catch (err) {

    logger.error(
      `Fetching Appointments failed: ${err.message}`
    );

    next(err);
  }
};
// exports.getAllAppGrievCompbyTypenStatus = async (req, res, next) => {
//   try {
//     const { user_type } = req;

//     const {
//       leader_regd_mobile_no,
//       user_email_id,
//       request_type,
//       status
//     } = req.query;

//     console.log('Request Query Params:', req.query);

//     // ----------------------------------------------------------
//     // Required parameters
//     // ----------------------------------------------------------

//     if (
//       !leader_regd_mobile_no ||
//       !user_email_id ||
//       !request_type
//     ) {
//       return res.status(400).json({
//         error: 'Missing required query parameters'
//       });
//     }

//     console.log('Query Filter:', {
//       leader_regd_mobile_no,
//       user_email_id,
//       request_type,
//       status
//     });


//     // ----------------------------------------------------------
//     // Get user-specific query
//     // ----------------------------------------------------------

//     const query = getDynamicQuery(
//       user_type,
//       leader_regd_mobile_no,
//       user_email_id
//     );


//     if (!query) {
//       return res.status(403).json({
//         message: 'Unauthorized user type'
//       });
//     }


//     console.log(
//       'getAllAppGrievCompbyTypenStatus -> dynamic query:',
//       query
//     );


//     // ----------------------------------------------------------
//     // Build final query
//     // ----------------------------------------------------------

//     const finalQuery = {
//       ...query,
//       request_type
//     };


//     // ----------------------------------------------------------
//     // STATUS IS OPTIONAL
//     //
//     // If status is provided:
//     //     filter by that status
//     //
//     // If status is not provided:
//     //     don't add status to query
//     //     => all statuses will be returned
//     // ----------------------------------------------------------

//     if (
//       status !== undefined &&
//       status !== null &&
//       String(status).trim() !== ''
//     ) {
//       finalQuery.status = status;
//     }


//     console.log(
//       '📄 Final Query:',
//       finalQuery
//     );


//     // ----------------------------------------------------------
//     // Fetch documents
//     // ----------------------------------------------------------

//     const entries =
//       await AppGrievComp
//         .find(finalQuery)
//         .sort({
//           createdAt: -1
//         });


//     const no_docs = entries.length;

//     console.log(
//       'Total # Documents found:',
//       no_docs
//     );


//     return res.status(200).json(entries);

//   } catch (err) {

//     logger.error(
//       `Fetching Appointments failed: ${err.message}`
//     );

//     next(err);
//   }
// };

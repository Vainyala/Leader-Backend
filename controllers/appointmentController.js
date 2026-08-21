const Appointment = require('../models/Appointment');
const AuditLog = require('../models/auditLog');
const logger = require('../utils/logger');
const getDynamicQuery = require('../utils/getDynamicQuery');
const User = require('../models/User');
const notificationService = require('../services/notificationService');


// ============================================================
// Allowed Appointment Statuses
// ============================================================

const STATUS_VALUES = [
  'Open',
  'In Progress',
  'Rejected',
  'Resolved',
  'Cancelled'
];


// ============================================================
// CREATE APPOINTMENT
// ============================================================

exports.createAppointment = async (req, res, next) => {

  try {

    console.log(
      'Request Body:',
      req.body
    );


    // ----------------------------------------------------------
    // Remove regn_no from request so user cannot manually set it
    // ----------------------------------------------------------

    const {
      regn_no,
      status,
      ...safeData
    } = req.body;


    const {
      user_type
    } = req;


    console.log(
      'User Type received from authenticate:',
      user_type
    );


    // ----------------------------------------------------------
    // Admin cannot create appointment
    // ----------------------------------------------------------

    if (user_type === 'admin') {

      console.log(
        'createAppointment -> user_type: admin: Request cant be created'
      );

      return res.status(403).json({
        status: 'error',
        message:
          'Oops! Login as Normal User to Raise a Request.'
      });
    }


    // ----------------------------------------------------------
    // Create appointment
    //
    // status is intentionally not taken from frontend.
    // Model will automatically set status = Open.
    // ----------------------------------------------------------

    const newEntry =
      new Appointment(safeData);


    await newEntry.save();


    // ----------------------------------------------------------
    // Send notification
    // ----------------------------------------------------------

    try {

      const user =
        await User.findOne({
          leader_regd_mobile_no:
            newEntry.leader_regd_mobile_no
        });


      if (user?.fcm_token) {

        await notificationService.sendNotification({

          token:
            user.fcm_token,

          title:
            'Appointment Submitted',

          body:
            `Your appointment ${newEntry.regn_no} has been submitted successfully.`,

          type:
            'appointment'
        });
      }

    } catch (notifErr) {

      console.warn(
        'Notification failed (non-blocking):',
        notifErr.message
      );
    }


    // ----------------------------------------------------------
    // Audit Log
    // ----------------------------------------------------------

    await AuditLog.create({

      user_id:
        req.user.userId,

      action:
        'CREATE_APPOINTMENT',

      field:
        'regn_no',

      leader_regd_mobile_no:
        newEntry.leader_regd_mobile_no,

      timestamp:
        new Date()
    });


    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    const result = {

      message:
        'Congrats! Your Appointment Request registered successfully',

      regn_no:
        newEntry.regn_no,

      status:
        newEntry.status
    };


    return res.status(201).json(
      result
    );


  } catch (err) {

    logger.error(
      `Appointment creation failed: ${err.message}`
    );


    return res.status(500).json({

      error:
        'Server error',

      details:
        err.message,

      requestId:
        req.headers['x-request-id'] || 'N/A'
    });
  }
};


// ============================================================
// FIND APPOINTMENT
// ============================================================

exports.findAppointment = async (
  req,
  res
) => {

  try {

    console.log(
      'findAppointment: Request Query:',
      req.query
    );


    const {
      leader_regd_mobile_no,
      user_email_id,
      regn_no
    } = req.query;


    const {
      user_type
    } = req;


    console.log(
      'User Type received from authenticate:',
      user_type
    );


    const query =
      getDynamicQuery(
        user_type,
        leader_regd_mobile_no,
        user_email_id
      );


    if (!query) {

      return res.status(403).json({
        message:
          'Unauthorized user type'
      });
    }


    const finalQuery = {
      ...query,
      regn_no
    };


    console.log(
      'Final Query:',
      finalQuery
    );


    const appointment =
      await Appointment
        .findOne(finalQuery)
        .sort({
          createdAt: -1
        });


    if (!appointment) {

      return res.status(404).json({
        error:
          'Appointment not found'
      });
    }


    return res.status(200).json(
      appointment
    );


  } catch (err) {

    logger.error(
      `Finding Appointment failed: ${err.message}`
    );


    return res.status(500).json({
      error:
        'Server error'
    });
  }
};


// ============================================================
// GET ALL APPOINTMENTS
// ============================================================

exports.getAllAppointments = async (
  req,
  res,
  next
) => {

  try {

    const {
      leader_regd_mobile_no,
      user_email_id
    } = req.query;


    const {
      user_type
    } = req;


    const query =
      getDynamicQuery(
        user_type,
        leader_regd_mobile_no,
        user_email_id
      );


    if (!query) {

      return res.status(403).json({
        message:
          'Unauthorized user type'
      });
    }


    console.log(
      'getAllAppointments: Dynamic Query:',
      query
    );


    const entries =
      await Appointment
        .find(query)
        .sort({
          createdAt: -1
        });


    console.log(
      'Total # Documents found:',
      entries.length
    );


    return res.status(200).json(
      entries
    );


  } catch (err) {

    logger.error(
      `Fetching Appointments failed: ${err.message}`
    );


    return next(err);
  }
};


// ============================================================
// UPDATE APPOINTMENT
// ============================================================

exports.updateAppointment = async (
  req,
  res,
  next
) => {

  try {

    const {
      user_type
    } = req;


    console.log(
      'User Type received from authenticate:',
      user_type
    );


    // ----------------------------------------------------------
    // Normal user cannot update
    // ----------------------------------------------------------

    if (user_type === 'user') {

      console.log(
        'updateAppointment -> user_type: user: Edit action forbidden.'
      );


      return res.status(403).json({
        error:
          'Oops! You are not authorized to Edit Request.'
      });
    }


    // ----------------------------------------------------------
    // Extract identifiers
    // ----------------------------------------------------------

    const {
      leader_regd_mobile_no,
      user_email_id,
      regn_no,
      ...updatePayload
    } = req.body;


    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !regn_no
    ) {

      return res.status(400).json({
        error:
          'Missing required body parameters'
      });
    }


    console.log(
      'Update Filter:',
      {
        leader_regd_mobile_no,
        regn_no
      }
    );


    console.log(
      'Update Payload:',
      updatePayload
    );


    // ----------------------------------------------------------
    // Validate status
    // ----------------------------------------------------------

    if (
      updatePayload.status &&
      !STATUS_VALUES.includes(
        updatePayload.status
      )
    ) {

      return res.status(400).json({

        error:
          'Invalid appointment status',

        allowed_statuses:
          STATUS_VALUES
      });
    }


    // ----------------------------------------------------------
    // Update Appointment
    // ----------------------------------------------------------

    const updated =
      await Appointment.findOneAndUpdate(

        {
          leader_regd_mobile_no,
          regn_no
        },

        {
          $set:
            updatePayload
        },

        {
          new: true,
          runValidators: true
        }
      );


    // ----------------------------------------------------------
    // Check appointment exists BEFORE using updated
    // ----------------------------------------------------------

    if (!updated) {

      return res.status(404).json({
        error:
          'Appointment not found with given identifiers'
      });
    }


    // ----------------------------------------------------------
    // Send notification
    // ----------------------------------------------------------

    try {

      const user =
        await User.findOne({
          leader_regd_mobile_no:
            updated.leader_regd_mobile_no
        });


      if (user?.fcm_token) {

        let title =
          'Appointment Updated';

        let body =
          `Your Appointment ${updated.regn_no} has been updated`;


        // ------------------------------------------------------
        // Status-specific notification
        // ------------------------------------------------------

        if (
          updated.status === 'Open'
        ) {

          title =
            'Appointment Open';

          body =
            `Your Appointment ${updated.regn_no} is open`;
        }


        if (
          updated.status === 'In Progress'
        ) {

          title =
            'Appointment In Progress';

          body =
            `Your Appointment ${updated.regn_no} is now in progress`;
        }


        if (
          updated.status === 'Rejected'
        ) {

          title =
            'Appointment Rejected';

          body =
            `Your Appointment ${updated.regn_no} has been rejected`;
        }


        if (
          updated.status === 'Resolved'
        ) {

          title =
            'Appointment Resolved';

          body =
            `Your Appointment ${updated.regn_no} has been resolved`;
        }


        if (
          updated.status === 'Cancelled'
        ) {

          title =
            'Appointment Cancelled';

          body =
            `Your Appointment ${updated.regn_no} has been cancelled`;
        }


        // ------------------------------------------------------
        // Admin comment notification
        // ------------------------------------------------------

        if (
          req.body.action_taken_comments
        ) {

          title =
            'New Comment Added';

          body =
            `Admin added a comment on appointment ${updated.regn_no}`;
        }


        await notificationService.sendNotification({

          token:
            user.fcm_token,

          title,

          body,

          type:
            'appointment_update'
        });
      }

    } catch (notifErr) {

      console.warn(
        'Notification failed (non-blocking):',
        notifErr.message
      );
    }


    // ----------------------------------------------------------
    // Audit Log
    // ----------------------------------------------------------

    await AuditLog.create({

      user_id:
        req.user.userId,

      action:
        'UPDATE_APPOINTMENT',

      field:
        'regn_no',

      leader_regd_mobile_no:
        updated.leader_regd_mobile_no,

      timestamp:
        new Date()
    });


    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    const result = {

      message:
        'Congrats! Appointment details updated successfully',

      regn_no:
        updated.regn_no,

      status:
        updated.status
    };


    return res.status(200).json(
      result
    );


  } catch (err) {

    logger.error(
      `Appointment update failed: ${err.message}`
    );


    return next(err);
  }
};


// ============================================================
// DELETE APPOINTMENT
// ============================================================

exports.deleteAppointment = async (
  req,
  res,
  next
) => {

  try {

    const {
      user_type
    } = req;


    console.log(
      'deleteAppointment -> User Type received from authenticate:',
      user_type
    );


    // ----------------------------------------------------------
    // Normal user cannot delete
    // ----------------------------------------------------------

    if (user_type === 'user') {

      return res.status(403).json({
        error:
          'Oops! You are not authorized to Delete Request.'
      });
    }


    const {
      leader_regd_mobile_no,
      user_email_id,
      regn_no
    } = req.query;


    console.log(
      'Query Params:',
      req.query
    );


    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !regn_no
    ) {

      return res.status(400).json({
        error:
          'Missing required Query parameters'
      });
    }


    console.log(
      'Delete Filter:',
      {
        leader_regd_mobile_no,
        regn_no
      }
    );


    const deleted =
      await Appointment.findOneAndDelete({

        leader_regd_mobile_no,

        regn_no
      });


    if (!deleted) {

      return res.status(404).json({
        error:
          'Appointment not found with given identifiers'
      });
    }


    // ----------------------------------------------------------
    // Audit Log
    // ----------------------------------------------------------

    await AuditLog.create({

      user_id:
        req.user.userId,

      action:
        'DELETE_APPOINTMENT',

      field:
        'regn_no',

      // Fixed typo:
      // laeder_regd_mobile_no ❌
      // leader_regd_mobile_no ✅

      leader_regd_mobile_no:
        deleted.leader_regd_mobile_no,

      timestamp:
        new Date()
    });


    return res.status(200).json({

      message:
        'Appointment deleted successfully',

      regn_no:
        deleted.regn_no
    });


  } catch (err) {

    logger.error(
      `Appointment deletion failed: ${err.message}`
    );


    return next(err);
  }
};


// ============================================================
// COUNT ALL APPOINTMENTS
// ============================================================

exports.countAllAppointments = async (
  req,
  res,
  next
) => {

  try {

    const {
      leader_regd_mobile_no,
      user_email_id
    } = req.query;


    const {
      user_type
    } = req;


    console.log(
      'Query Params:',
      req.query
    );


    if (
      !leader_regd_mobile_no ||
      !user_email_id
    ) {

      return res.status(400).json({
        error:
          'Missing required Query parameters'
      });
    }


    const query =
      getDynamicQuery(
        user_type,
        leader_regd_mobile_no,
        user_email_id
      );


    if (!query) {

      return res.status(403).json({
        message:
          'Unauthorized user type'
      });
    }


    console.log(
      'countAllAppointments -> Dynamic Query:',
      query
    );


    const count =
      await Appointment.countDocuments(
        query
      );


    console.log(
      'Total # Appointments found:',
      count
    );


    return res.status(200).json({

      message:
        'Request Type: Appointments',

      count
    });


  } catch (err) {

    logger.error(
      `Fetching Appointments failed: ${err.message}`
    );


    return next(err);
  }
};


// ============================================================
// COUNT APPOINTMENTS BY STATUS
// ============================================================

exports.countAllAppointmentsbyStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      user_type
    } = req;


    const {
      leader_regd_mobile_no,
      user_email_id,
      status
    } = req.query;


    console.log(
      'Query Params:',
      req.query
    );


    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !status
    ) {

      return res.status(400).json({
        error:
          'Missing required Query parameters'
      });
    }


    // ----------------------------------------------------------
    // Validate status
    // ----------------------------------------------------------

    if (
      !STATUS_VALUES.includes(status)
    ) {

      return res.status(400).json({

        error:
          'Invalid appointment status',

        allowed_statuses:
          STATUS_VALUES
      });
    }


    const query =
      getDynamicQuery(
        user_type,
        leader_regd_mobile_no,
        user_email_id
      );


    if (!query) {

      return res.status(403).json({
        message:
          'Unauthorized user type'
      });
    }


    const finalQuery = {
      ...query,
      status
    };


    console.log(
      'Final Query:',
      finalQuery
    );


    const count =
      await Appointment.countDocuments(
        finalQuery
      );


    console.log(
      'Total Appointments found:',
      count
    );


    return res.status(200).json({

      message:
        `Request Type: Appointments, Status: ${status}`,

      count
    });


  } catch (err) {

    logger.error(
      `Fetching Appointments failed: ${err.message}`
    );


    return next(err);
  }
};


// ============================================================
// GET ALL APPOINTMENTS BY STATUS
// ============================================================

exports.getAllAppointmentsbyStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      user_type
    } = req;


    const {
      leader_regd_mobile_no,
      user_email_id,
      status
    } = req.query;


    console.log(
      'Query Params:',
      req.query
    );


    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !status
    ) {

      return res.status(400).json({
        error:
          'Missing required Query parameters'
      });
    }


    // ----------------------------------------------------------
    // Validate status
    // ----------------------------------------------------------

    if (
      !STATUS_VALUES.includes(status)
    ) {

      return res.status(400).json({

        error:
          'Invalid appointment status',

        allowed_statuses:
          STATUS_VALUES
      });
    }


    const query =
      getDynamicQuery(
        user_type,
        leader_regd_mobile_no,
        user_email_id
      );


    if (!query) {

      return res.status(403).json({
        message:
          'Unauthorized user type'
      });
    }


    const finalQuery = {
      ...query,
      status
    };


    console.log(
      'Final Query:',
      finalQuery
    );


    const entries =
      await Appointment
        .find(finalQuery)
        .sort({
          createdAt: -1
        });


    console.log(
      'Total Appointments found:',
      entries.length
    );


    return res.status(200).json(
      entries
    );


  } catch (err) {

    logger.error(
      `Fetching Appointments failed: ${err.message}`
    );


    return next(err);
  }
};












// const { query } = require('winston');
// const Appointment = require('../models/Appointment');
// const AuditLog = require('../models/auditLog');
// const logger = require('../utils/logger');
// const getDynamicQuery = require('../utils/getDynamicQuery');
// const User = require('../models/User');
// const notificationService = require('../services/notificationService');


// exports.createAppointment = async (req, res, next) => {
//   try {
//     console.log('Request Body:', req.body);

//     // Strip regn_no if present to enforce auto-generation
//     const { regn_no, ...safeData } = req.body;

//     const { user_type } = req;

//     console.log('User Type received from authenticate:', user_type);

//     if (user_type === 'admin') {
//       console.log('createAppointment -> user_type: admin: Request cant be created');
//       return res.status(201).json('Oops! Login as Normal User to Raise a Request.');
//     }

//     const newEntry = new Appointment(safeData);
//     await newEntry.save(); // triggers pre('save') hook for regn_no

//     try {
//       const user = await User.findOne({
//         leader_regd_mobile_no: newEntry.leader_regd_mobile_no
//       });

//       if (user?.fcm_token) {
//         await notificationService.sendNotification({
//           token: user.fcm_token,
//           title: "Appointment Submitted",
//           body: "Your appointment request has been submitted.",
//           type: "appointment"
//         });
//       }
//     } catch (notifErr) {
//       console.warn(
//         "Notification failed (non-blocking):",
//         notifErr.message
//       );
//     }


//     await AuditLog.create({
//       user_id: req.user.userId,
//       action: 'CREATE_APPOINTMENT',
//       field: 'regn_no',
//       leader_regd_mobile_no: newEntry.leader_regd_mobile_no,
//       timestamp: new Date()
//     });

//     //result = 'Congrates! Your Appointment Request registered successfully Vide Regn# '+newEntry.regn_no;
//     result = {
//       message: 'Congrats! Your Appointment Request registered successfully',
//       regn_no: newEntry.regn_no
//     };
//     res.status(201).json(result);
//     //res.status(201).json(newEntry);
//   } catch (err) {
//     logger.error(`Appointment creation failed: ${err.message}`);
//     res.status(500).json({
//       error: 'Server error',
//       details: err.message,
//       requestId: req.headers['x-request-id'] || 'N/A'
//     });
//   }
// };

// // Routes: /api/appointments/search --- 14/09/2025
// exports.findAppointment = async (req, res) => {

//   try {
//     console.log("findAppointment:  Request Query: ", req.query);
//     const { leader_regd_mobile_no, user_email_id, regn_no } = req.query;
//     const { user_type } = req;

//     console.log('User Type received from authenticate:', user_type);

//     const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);

//     if (!query) {
//       return res.status(403).json({ message: 'Unauthorized user type' });
//     } else {
//       console.log('findAppointment->Dynamic Query received:', query);
//     }

//     const finalQuery = { ...query, regn_no };
//     console.log('Final Query:', finalQuery);

//     const appointment = await Appointment.findOne(finalQuery).sort({ createdAt: -1 });

//     if (!appointment) {
//       return res.status(404).json({ error: 'Appointment not found' });
//     }

//     res.json(appointment);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Get all appointments
// exports.getAllAppointments = async (req, res, next) => {
//   try {
//     const { leader_regd_mobile_no, user_email_id } = req.query;
//     const { user_type } = req;

//     const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
//     if (!query) {
//       return res.status(403).json({ message: 'Unauthorized user type' });
//     } else {
//       console.log('getAllAppointments: Dynamic Query: ', query);
//     }
//     const entries = await Appointment.find(query).sort({ createdAt: -1 });
//     const no_docs = entries.length;

//     console.log('Total # Documents found:', no_docs);
//     res.status(200).json(entries);
//   } catch (err) {
//     logger.error(`Fetching Appointments failed: ${err.message}`);
//     next(err);
//   }
// };

// // Update an Appointment for a given leader_regd_mobile_no, user_email_id and regn_no
// exports.updateAppointment = async (req, res, next) => {
//   try {
//     const { user_type } = req;

//     console.log('User Type received from authenticate:', user_type);

//     if (user_type === 'user') {
//       console.log('updateAppointment -> user_type: user: Edit action forbidden.');
//       return res.status(201).json('Oops! You are not authorized to Edit Request.');
//     }

//     let result = '';

//     const { leader_regd_mobile_no, user_email_id, regn_no, ...updatePayload } = req.body;

//     if (!leader_regd_mobile_no || !user_email_id || !regn_no) {
//       return res.status(400).json({ error: 'Missing required body parameters' });
//     }

//     console.log('Update Filter:', { leader_regd_mobile_no, regn_no });
//     console.log('Update Payload:', updatePayload);

//     const updated = await Appointment.findOneAndUpdate(
//       { leader_regd_mobile_no, regn_no },
//       { $set: updatePayload },
//       { new: true }
//     );

//     try {

//       const user = await User.findOne({
//         leader_regd_mobile_no: updated.leader_regd_mobile_no
//       });

//       if (user?.fcm_token) {

//         let title = "Appointment Updated";
//         let body = `Your Appointment ${updated.regn_no} has been updated`;

//         if (updated.status === "APPROVED") {
//           title = "Appointment Approved";
//           body = `Your Appointment ${updated.regn_no} has been approved`;
//         }

//         if (updated.status === "REJECTED") {
//           title = "Appointment Rejected";
//           body = `Your appointment ${updated.regn_no} has been rejected`;
//         }

//         if (req.body.admin_comments) {
//           title = "New Comment Added";
//           body = `Admin added a comment on appointment ${updated.regn_no}`;
//         }

//         await notificationService.sendNotification({
//           token: user.fcm_token,
//           title,
//           body,
//           type: "appointment_update"
//         });
//       }

//     } catch (notifErr) {
//       console.warn(
//         "Notification failed:",
//         notifErr.message
//       );
//     }

//     if (!updated) {
//       return res.status(404).json({ error: 'Appointment not found with given identifiers' });
//     }

//     await AuditLog.create({
//       user_id: req.user.userId,
//       action: 'UPDATE_APPOINTMENT',
//       field: 'regn_no',
//       leader_regd_mobile_no: updated.leader_regd_mobile_no,
//       timestamp: new Date()
//     });

//     //    result = 'Congrates! Appointment details updated successfully Vide Regn# '+updated.regn_no;
//     result = {
//       message: 'Congrates! Appointment details updated successfully',
//       regn_no: updated.regn_no
//     };

//     res.status(201).json(result);
//     //res.status(200).json(updated);
//   } catch (err) {
//     logger.error(`Appointment update failed: ${err.message}`);
//     next(err);
//   }
// };


// // Delete an Appointment using leader_regd_mobile_no, user_email_id, and regn_no
// exports.deleteAppointment = async (req, res, next) => {
//   try {

//     const { user_type } = req;

//     console.log('deleteAppointment->User Type received from authenticate:', user_type);

//     if (user_type === 'user') {
//       console.log('deleteAppointment -> user_type: user: Edit action forbidden.');
//       return res.status(201).json('Oops! Ypu are not authorized to Delete Request.');
//     }

//     const { leader_regd_mobile_no, user_email_id, regn_no } = req.query;
//     console.log('Query Params:', req.query);

//     if (!leader_regd_mobile_no || !user_email_id || !regn_no) {
//       return res.status(400).json({ error: 'Missing required Query parameters' });
//     }

//     console.log('Delete Filter:', { leader_regd_mobile_no, user_email_id, regn_no });

//     const deleted = await Appointment.findOneAndDelete({
//       leader_regd_mobile_no,
//       regn_no
//     });

//     if (!deleted) {
//       return res.status(404).json({ error: 'Appointment not found with given identifiers' });
//     }

//     await AuditLog.create({
//       user_id: req.user.userId,
//       action: 'DELETE_APPOINTMENT',
//       field: 'regn_no',
//       laeder_regd_mobile_no: deleted.leader_regd_mobile_no,
//       timestamp: new Date()
//     });

//     res.status(200).json({
//       message: 'Appointment deleted successfully',
//       regn_no: deleted.regn_no
//     });
//   } catch (err) {
//     logger.error(`Appointment deletion failed: ${err.message}`);
//     next(err);
//   }
// };


// // Get count of all appointments - for Dashboard
// exports.countAllAppointments = async (req, res, next) => {
//   try {
//     const { leader_regd_mobile_no, user_email_id } = req.query;
//     console.log('Query Params:', req.query);

//     const { user_type } = req;

//     if (!leader_regd_mobile_no || !user_email_id) {
//       return res.status(400).json({ error: 'Missing required Query parameters' });
//     }
//     console.log('Query Filter:', { leader_regd_mobile_no, user_email_id });

//     const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
//     if (!query) {
//       return res.status(403).json({ message: 'Unauthorized user type' });
//     } else {
//       console.log('countAllAppointments->dynamic query: ', query);
//     }

//     const entries = await Appointment.find(query);

//     tot_no_docs = entries.length;
//     console.log('Total # Appoints found: ', tot_no_docs);

//     res.status(200).json({
//       message: 'Request Type: Appointments',
//       count: tot_no_docs
//     });
//   } catch (err) {
//     logger.error(`Fetching Appointments failed: ${err.message}`);
//     next(err);
//   }
// };


// // Get count of all appointments by status - for Dashboard
// exports.countAllAppointmentsbyStatus = async (req, res, next) => {
//   try {
//     const { user_type } = req;
//     const { leader_regd_mobile_no, user_email_id, status } = req.query;

//     console.log('📥 Query Params:', req.query);

//     if (!leader_regd_mobile_no || !user_email_id || !status) {
//       return res.status(400).json({ error: 'Missing required Query parameters' });
//     }

//     const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
//     if (!query) {
//       return res.status(403).json({ message: 'Unauthorized user type' });
//     } else {
//       console.log('getAllAppointments->dynamic query: ', query);
//     }

//     const finalQuery = { ...query, status };
//     console.log('📄 Final Query:', finalQuery);

//     const entries = await Appointment.find(finalQuery);
//     const count = entries.length;

//     console.log('📊 Total Appointments found:', count);

//     res.status(200).json({
//       message: `Request Type: Appointments, Status: ${status}`,
//       count: count
//     });
//   } catch (err) {
//     logger.error(`❌ Fetching Appointments failed: ${err.stack}`);
//     next(err);
//   }
// };

// // Get count of  all appointments by given Status for Dashboard
// exports.getAllAppointmentsbyStatus = async (req, res, next) => {
//   try {
//     const { user_type } = req;
//     const { leader_regd_mobile_no, user_email_id, status } = req.query;
//     console.log('Query Params:', req.query);

//     if (!leader_regd_mobile_no || !user_email_id || !status) {
//       return res.status(400).json({ error: 'Missing required Query parameters' });
//     }
//     console.log('Query Filter:', { leader_regd_mobile_no, user_email_id, status });

//     const query = getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id);
//     if (!query) {
//       return res.status(403).json({ message: 'Unauthorized user type' });
//     }

//     const finalQuery = { ...query, status };
//     console.log('📄 Final Query:', finalQuery);

//     const entries = await Appointment.find(finalQuery).sort({ createdAt: -1 });
//     const count = entries.length;

//     console.log('📊 Total Appointments found:', count);

//     res.status(200).json(entries);
//   } catch (err) {
//     logger.error(`Fetching Appointments failed: ${err.message}`);
//     next(err);
//   }
// };

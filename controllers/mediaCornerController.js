const LeaderCoordinates = require('../models/LeaderCoordinates');

const fs = require('fs');
const path = require('path');

const logger = require('../utils/logger');
const { logFileChange } = require('../utils/auditLogger');

const mediaCorner = require('../models/mediaCorner');
const notificationService = require('../services/notificationService');


/**
 * ============================================================
 * Helper: Delete media file from disk
 * ============================================================
 */
const deleteFile = (relativePath) => {

  if (!relativePath || relativePath === 'null') {
    return;
  }

  const fullPath = path.join(
    process.cwd(),
    'uploads',
    'media_corner',
    relativePath
  );

  if (fs.existsSync(fullPath)) {

    fs.unlinkSync(fullPath);

    logger.info(
      `Deleted media file: ${relativePath}`
    );
  }
};


/**
 * ============================================================
 * Helper: Normalize Yes / No
 * ============================================================
 */
const normalizeUserInput = (value) => {

  if (
    value &&
    String(value).trim().toLowerCase() === 'yes'
  ) {
    return 'Yes';
  }

  return 'No';
};


/**
 * ============================================================
 * Helper: Start of day
 * ============================================================
 */
const startOfDay = (date) => {

  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d;
};


/**
 * ============================================================
 * Helper: End of day
 * ============================================================
 */
const endOfDay = (date) => {

  const d = new Date(date);

  d.setHours(23, 59, 59, 999);

  return d;
};


/**
 * ============================================================
 * CREATE MEDIA CORNER
 * ============================================================
 */
exports.createMediaCorner = async (req, res) => {

  const requestId = req.requestId || 'N/A';

  try {

    console.log(
      'createMediaCorner -> Request Body:',
      req.body
    );

    console.log(
      'createMediaCorner -> Request File:',
      req.file
    );


    const {
      leader_regd_mobile_no,
      media_header,
      media_narration,
      media_url,
      media_type,
      custom_text,
      user_input,
      from_date,
      to_date
    } = req.body;


    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------
    if (
      !leader_regd_mobile_no ||
      !media_header ||
      !media_narration ||
      !media_type
    ) {

      return res.status(400).json({
        message:
          'Missing required parameters: leader_regd_mobile_no, media_header, media_narration and media_type'
      });
    }


    // --------------------------------------------------------
    // Role validation
    // --------------------------------------------------------
    console.log(
      'Role check:',
      req.user_type,
      'User ID:',
      req.user?.userId
    );

    if (req.user_type === 'user') {

      return res.status(403).json({
        status: 'error',
        message: 'Alert! Action forbidden'
      });
    }


    // --------------------------------------------------------
    // Normalize Yes / No
    // --------------------------------------------------------
    const normalizedUserInput =
      normalizeUserInput(user_input);


    // --------------------------------------------------------
    // Validate Yes case
    // --------------------------------------------------------
    if (normalizedUserInput === 'Yes') {

      if (
        !custom_text ||
        !custom_text.trim()
      ) {

        return res.status(400).json({
          message:
            'custom_text is required when user_input is Yes'
        });
      }


      if (!from_date || !to_date) {

        return res.status(400).json({
          message:
            'from_date and to_date are required when user_input is Yes'
        });
      }


      const fromDate = startOfDay(from_date);
      const toDate = endOfDay(to_date);


      if (fromDate > toDate) {

        return res.status(400).json({
          message:
            'from_date cannot be greater than to_date'
        });
      }
    }


    // --------------------------------------------------------
    // Check leader exists
    // --------------------------------------------------------
    const exists = await LeaderCoordinates.findOne({
      leader_regd_mobile_no
    });

    console.log(
      'Leader Master Record:',
      exists
    );


    if (!exists) {

      logger.warn(
        `[${requestId}] Create failed: Leader not found ${leader_regd_mobile_no}`
      );

      return res.status(404).json({
        error:
          'Leader not found in master records'
      });
    }


    // --------------------------------------------------------
    // Uploaded file
    // --------------------------------------------------------
    const mediaFilePath = req.file
      ? req.file.filename
      : null;


    // --------------------------------------------------------
    // Prepare document
    // --------------------------------------------------------
    const mediaData = {

      leader_regd_mobile_no,

      media_header,

      media_narration,

      media_url:
        media_url || null,

      media_type,

      media_file:
        mediaFilePath,

      user_input:
        normalizedUserInput,

      custom_text:
        normalizedUserInput === 'Yes'
          ? custom_text.trim()
          : null,

      from_date:
        normalizedUserInput === 'Yes'
          ? startOfDay(from_date)
          : null,

      to_date:
        normalizedUserInput === 'Yes'
          ? endOfDay(to_date)
          : null
    };


    // --------------------------------------------------------
    // Create Media Corner
    // --------------------------------------------------------
    const mediacorner =
      await mediaCorner.create(mediaData);


    logger.info(
      `[${requestId}] Media Corner created: ${mediacorner._id}`
    );


    // --------------------------------------------------------
    // Notify all users of this leader (saved + push)
    // --------------------------------------------------------
    notificationService.notifyLeaderUsers(leader_regd_mobile_no, {
      title: 'New Media Added',
      body: media_header,
      type: 'media',
      reference_id: mediacorner._id
    });


    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------
    return res.status(201).json({

      message:
        'Media Corner data created successfully',

      data: mediacorner
    });


  } catch (error) {

    logger.error(
      `Media Corner creation error: ${error.message}`
    );


    // --------------------------------------------------------
    // If DB creation failed after file upload,
    // remove uploaded file.
    // --------------------------------------------------------
    if (req.file) {

      try {

        deleteFile(req.file.filename);

      } catch (fileError) {

        logger.error(
          `Failed to delete uploaded file after error: ${fileError.message}`
        );
      }
    }


    return res.status(500).json({

      error:
        'Media Corner data creation failed',

      details:
        error.message
    });
  }
};


/**
 * ============================================================
 * GET MEDIA CORNER
 *
 * Query parameters:
 *
 * leader_regd_mobile_no
 * media_type
 * status = latest / history
 *
 * ============================================================
 */
exports.getMediaCorner = async (req, res, next) => {

  const {
    leader_regd_mobile_no,
    media_type,
    status = 'latest'
  } = req.query;


  const requestId =
    req.requestId || 'N/A';


  const hostUrl =
    process.env.HOST_URL;


  logger.info(
    `[${requestId}] getMediaCorner -> leader=${leader_regd_mobile_no}, media_type=${media_type}, status=${status}`
  );


  // --------------------------------------------------------
  // Validation
  // --------------------------------------------------------
  if (
    !leader_regd_mobile_no ||
    !media_type
  ) {

    return res.status(400).json({

      error:
        'Missing required parameters: leader_regd_mobile_no and/or media_type'
    });
  }


  // --------------------------------------------------------
  // Validate status
  // --------------------------------------------------------
  if (
    status !== 'latest' &&
    status !== 'history'
  ) {

    return res.status(400).json({

      error:
        'Invalid status. Use latest or history'
    });
  }


  try {

    const today =
      startOfDay(new Date());


    let query = {

      leader_regd_mobile_no,

      media_type
    };


    // ========================================================
    // LATEST
    // ========================================================
    if (status === 'latest') {

      query.$or = [

        // ----------------------------------------------------
        // Case 1:
        // user_input = No
        //
        // Created date + 30 days
        // ----------------------------------------------------
        {
          user_input: 'No',

          $expr: {

            $gte: [

              {
                $dateAdd: {

                  startDate: '$createdAt',

                  unit: 'day',

                  amount: 30
                }
              },

              today
            ]
          }
        },


        // ----------------------------------------------------
        // Case 2:
        // user_input = Yes
        //
        // Today must be between from_date and to_date
        // ----------------------------------------------------
        {
          user_input: 'Yes',

          from_date: {
            $lte: endOfDay(new Date())
          },

          to_date: {
            $gte: today
          }
        }
      ];
    }


    // ========================================================
    // HISTORY
    // ========================================================
    if (status === 'history') {

      query.$or = [

        // ----------------------------------------------------
        // Case 1:
        // user_input = No
        //
        // More than 30 days old
        // ----------------------------------------------------
        {
          user_input: 'No',

          $expr: {

            $lt: [

              {
                $dateAdd: {

                  startDate: '$createdAt',

                  unit: 'day',

                  amount: 30
                }
              },

              today
            ]
          }
        },


        // ----------------------------------------------------
        // Case 2:
        // user_input = Yes
        //
        // to_date has already passed
        // ----------------------------------------------------
        {
          user_input: 'Yes',

          to_date: {
            $lt: today
          }
        }
      ];
    }


    // --------------------------------------------------------
    // Latest date first
    // --------------------------------------------------------
    const records =
      await mediaCorner
        .find(query)
        .sort({
          createdAt: -1
        });


    if (
      !records ||
      records.length === 0
    ) {

      return res.status(200).json([]);
    }


    // --------------------------------------------------------
    // Construct media URL
    // --------------------------------------------------------
    const updatedRecords =
      records.map((record) => {

        const obj =
          record.toObject();


        if (
          obj.media_file &&
          obj.media_file !== 'null'
        ) {

          obj.media_file_url =
            `${hostUrl}/media/${obj.media_file}`;

        } else {

          obj.media_file_url =
            null;
        }


        // ----------------------------------------------------
        // Useful for frontend
        // ----------------------------------------------------
        if (obj.user_input === 'Yes') {

          const todayStart =
            startOfDay(new Date());

          const toDate =
            obj.to_date
              ? startOfDay(obj.to_date)
              : null;


          obj.is_date_expired =
            toDate
              ? todayStart > toDate
              : false;

        } else {

          obj.is_date_expired = false;
        }


        return obj;
      });


    return res.status(200).json(
      updatedRecords
    );


  } catch (error) {

    logger.error(
      `[${requestId}] Error fetching Media Corner: ${error.message}`,
      {
        stack: error.stack
      }
    );

    return next(error);
  }
};


/**
 * ============================================================
 * GET MEDIA CORNER IMAGE / VIDEO
 * ============================================================
 */
exports.getMediaCornerImage =
  (req, res, next) => {

    const filename =
      req.query.media_file;


    if (!filename) {

      return res.status(400).json({

        message:
          'media_file is required'
      });
    }


    const filePath =
      path.join(
        process.cwd(),
        'uploads',
        'media_corner',
        filename
      );


    console.log(
      'Media file path:',
      filePath
    );


    fs.access(
      filePath,
      fs.constants.F_OK,
      (err) => {

        if (err) {

          console.error(
            'Media file not found:',
            filePath
          );

          return res.status(404).json({

            message:
              'Media file not found or access denied'
          });
        }


        console.log(
          'Media file found:',
          filePath
        );


        const stream =
          fs.createReadStream(filePath);


        stream.on(
          'error',
          (streamError) => {

            console.error(
              'Error streaming media:',
              streamError.message
            );


            if (!res.headersSent) {

              return res.status(500).json({

                message:
                  'Error streaming media file'
              });
            }


            return next(streamError);
          }
        );


        stream.pipe(res);
      }
    );
  };


/**
 * ============================================================
 * UPDATE MEDIA CORNER
 * ============================================================
 */
exports.updateMediaCorner =
  async (req, res) => {

    try {

      const {
        id,
        user_input,
        custom_text,
        from_date,
        to_date
      } = req.body;


      if (!id) {

        return res.status(400).json({

          error:
            'Media Corner id is required'
        });
      }


      // ------------------------------------------------------
      // Role check
      // ------------------------------------------------------
      if (req.user_type === 'user') {

        return res.status(403).json({

          status: 'error',

          message:
            'Alert! Action forbidden'
        });
      }


      // ------------------------------------------------------
      // Find existing record
      // ------------------------------------------------------
      const existing =
        await mediaCorner.findOne({
          _id: id
        });


      if (!existing) {

        return res.status(404).json({

          error:
            'Media Data not found',

          id
        });
      }


      const updatePayload = {
        ...req.body
      };


      // ------------------------------------------------------
      // Normalize user_input
      // ------------------------------------------------------
      const normalizedUserInput =
        normalizeUserInput(
          user_input !== undefined
            ? user_input
            : existing.user_input
        );


      updatePayload.user_input =
        normalizedUserInput;


      // ------------------------------------------------------
      // If Yes
      // ------------------------------------------------------
      if (normalizedUserInput === 'Yes') {

        const finalCustomText =
          custom_text !== undefined
            ? custom_text
            : existing.custom_text;


        const finalFromDate =
          from_date !== undefined
            ? from_date
            : existing.from_date;


        const finalToDate =
          to_date !== undefined
            ? to_date
            : existing.to_date;


        if (
          !finalCustomText ||
          !finalCustomText.trim()
        ) {

          return res.status(400).json({

            error:
              'custom_text is required when user_input is Yes'
          });
        }


        if (!finalFromDate || !finalToDate) {

          return res.status(400).json({

            error:
              'from_date and to_date are required when user_input is Yes'
          });
        }


        const fromDate =
          startOfDay(finalFromDate);


        const toDate =
          endOfDay(finalToDate);


        if (fromDate > toDate) {

          return res.status(400).json({

            error:
              'from_date cannot be greater than to_date'
          });
        }


        updatePayload.custom_text =
          finalCustomText.trim();


        updatePayload.from_date =
          fromDate;


        updatePayload.to_date =
          toDate;
      }


      // ------------------------------------------------------
      // If No
      // ------------------------------------------------------
      if (normalizedUserInput === 'No') {

        updatePayload.custom_text = null;

        updatePayload.from_date = null;

        updatePayload.to_date = null;
      }


      // ------------------------------------------------------
      // File handling
      // ------------------------------------------------------
      if (req.file) {

        updatePayload.media_file =
          req.file.filename;

      } else {

        // Keep old file
        updatePayload.media_file =
          existing.media_file;
      }


      // ------------------------------------------------------
      // Update
      // ------------------------------------------------------
      const updatedMedia =
        await mediaCorner.findOneAndUpdate(

          {
            _id: id
          },

          updatePayload,

          {
            new: true,

            runValidators: true
          }
        );


      // ------------------------------------------------------
      // Delete old file only after DB update
      // ------------------------------------------------------
      if (
        req.file &&
        existing.media_file &&
        existing.media_file !== req.file.filename
      ) {

        deleteFile(
          existing.media_file
        );
      }


      // Notify all users of this leader (saved + push)
      notificationService.notifyLeaderUsers(updatedMedia.leader_regd_mobile_no, {
        title: 'Media Updated',
        body: updatedMedia.media_header,
        type: 'media_update',
        reference_id: updatedMedia._id
      });


      return res.status(200).json({

        message:
          'Media Corner updated successfully',

        data:
          updatedMedia
      });


    } catch (error) {

      logger.error(
        `Media Corner update failed: ${error.message}`
      );


      return res.status(400).json({

        error:
          'Media Corner update failed',

        details:
          error.message
      });
    }
  };


/**
 * ============================================================
 * DELETE MEDIA CORNER
 * ============================================================
 */
exports.deleteMediaCornerImage =
  async (req, res, next) => {

    const {
      leader_regd_mobile_no,
      id
    } = req.query;


    const requestId =
      req.requestId || 'N/A';


    const userId =
      req.headers['x-user-id'] ||
      'anonymous';


    try {

      if (!id) {

        return res.status(400).json({

          error:
            'Media Corner id is required'
        });
      }


      // IMPORTANT:
      // findOneAndDelete gives us the actual document,
      // unlike deleteOne()
      const profile =
        await mediaCorner.findOneAndDelete({
          _id: id
        });


      if (!profile) {

        logger.warn(
          `[${requestId}] Media Corner not found for delete: ${id}`
        );


        return res.status(404).json({

          error:
            'Media Corner data not found'
        });
      }


      notificationService.notifyLeaderChange(
        profile.leader_regd_mobile_no,
        'a media corner item',
        'removed'
      );


      // ------------------------------------------------------
      // Delete physical file
      // ------------------------------------------------------
      if (
        profile.media_file &&
        profile.media_file !== 'null'
      ) {

        deleteFile(
          profile.media_file
        );


        await logFileChange({

          leader_regd_mobile_no:
            leader_regd_mobile_no ||
            profile.leader_regd_mobile_no,

          action:
            'Deleted',

          filename:
            profile.media_file,

          field:
            'media_file',

          requestId,

          userId
        });

      } else {

        console.log(
          'No Media File found to delete'
        );
      }


      logger.info(
        `[${requestId}] Media Corner deleted: ${id}`
      );


      return res.status(200).json({

        message:
          'Media Corner data deleted'
      });


    } catch (error) {

      logger.error(
        `[${requestId}] Media Corner delete error: ${error.message}`
      );


      return next(error);
    }
  };





  




// const LeaderCoordinates = require('../models/LeaderCoordinates');

// const fs = require('fs');
// const path = require('path');

// const logger = require('../utils/logger');
// const { logFileChange } = require('../utils/auditLogger');

// const mediaCorner = require('../models/mediaCorner');
// const notificationService = require('../services/notificationService');


// /**
//  * ============================================================
//  * Helper: Delete media file from disk
//  * ============================================================
//  */
// const deleteFile = (relativePath) => {

//   if (!relativePath || relativePath === 'null') {
//     return;
//   }

//   const fullPath = path.join(
//     process.cwd(),
//     'uploads',
//     'media_corner',
//     relativePath
//   );

//   if (fs.existsSync(fullPath)) {

//     fs.unlinkSync(fullPath);

//     logger.info(
//       `Deleted media file: ${relativePath}`
//     );
//   }
// };


// /**
//  * ============================================================
//  * Helper: Normalize Yes / No
//  * ============================================================
//  */
// const normalizeUserInput = (value) => {

//   if (
//     value &&
//     String(value).trim().toLowerCase() === 'yes'
//   ) {
//     return 'Yes';
//   }

//   return 'No';
// };


// /**
//  * ============================================================
//  * Helper: Start of day
//  * ============================================================
//  */
// const startOfDay = (date) => {

//   const d = new Date(date);

//   d.setHours(0, 0, 0, 0);

//   return d;
// };


// /**
//  * ============================================================
//  * Helper: End of day
//  * ============================================================
//  */
// const endOfDay = (date) => {

//   const d = new Date(date);

//   d.setHours(23, 59, 59, 999);

//   return d;
// };


// /**
//  * ============================================================
//  * CREATE MEDIA CORNER
//  * ============================================================
//  */
// exports.createMediaCorner = async (req, res) => {

//   const requestId = req.requestId || 'N/A';

//   try {

//     console.log(
//       'createMediaCorner -> Request Body:',
//       req.body
//     );

//     console.log(
//       'createMediaCorner -> Request File:',
//       req.file
//     );


//     const {
//       leader_regd_mobile_no,
//       media_header,
//       media_narration,
//       media_url,
//       media_type,
//       custom_text,
//       user_input,
//       from_date,
//       to_date
//     } = req.body;


//     // --------------------------------------------------------
//     // Basic validation
//     // --------------------------------------------------------
//     if (
//       !leader_regd_mobile_no ||
//       !media_header ||
//       !media_narration ||
//       !media_type
//     ) {

//       return res.status(400).json({
//         message:
//           'Missing required parameters: leader_regd_mobile_no, media_header, media_narration and media_type'
//       });
//     }


//     // --------------------------------------------------------
//     // Role validation
//     // --------------------------------------------------------
//     console.log(
//       'Role check:',
//       req.user_type,
//       'User ID:',
//       req.user?.userId
//     );

//     if (req.user_type === 'user') {

//       return res.status(403).json({
//         status: 'error',
//         message: 'Alert! Action forbidden'
//       });
//     }


//     // --------------------------------------------------------
//     // Normalize Yes / No
//     // --------------------------------------------------------
//     const normalizedUserInput =
//       normalizeUserInput(user_input);


//     // --------------------------------------------------------
//     // Validate Yes case
//     // --------------------------------------------------------
//     if (normalizedUserInput === 'Yes') {

//       if (
//         !custom_text ||
//         !custom_text.trim()
//       ) {

//         return res.status(400).json({
//           message:
//             'custom_text is required when user_input is Yes'
//         });
//       }


//       if (!from_date || !to_date) {

//         return res.status(400).json({
//           message:
//             'from_date and to_date are required when user_input is Yes'
//         });
//       }


//       const fromDate = startOfDay(from_date);
//       const toDate = endOfDay(to_date);


//       if (fromDate > toDate) {

//         return res.status(400).json({
//           message:
//             'from_date cannot be greater than to_date'
//         });
//       }
//     }


//     // --------------------------------------------------------
//     // Check leader exists
//     // --------------------------------------------------------
//     const exists = await LeaderCoordinates.findOne({
//       leader_regd_mobile_no
//     });

//     console.log(
//       'Leader Master Record:',
//       exists
//     );


//     if (!exists) {

//       logger.warn(
//         `[${requestId}] Create failed: Leader not found ${leader_regd_mobile_no}`
//       );

//       return res.status(404).json({
//         error:
//           'Leader not found in master records'
//       });
//     }


//     // --------------------------------------------------------
//     // Uploaded file
//     // --------------------------------------------------------
//     const mediaFilePath = req.file
//       ? req.file.filename
//       : null;


//     // --------------------------------------------------------
//     // Prepare document
//     // --------------------------------------------------------
//     const mediaData = {

//       leader_regd_mobile_no,

//       media_header,

//       media_narration,

//       media_url:
//         media_url || null,

//       media_type,

//       media_file:
//         mediaFilePath,

//       user_input:
//         normalizedUserInput,

//       custom_text:
//         normalizedUserInput === 'Yes'
//           ? custom_text.trim()
//           : null,

//       from_date:
//         normalizedUserInput === 'Yes'
//           ? startOfDay(from_date)
//           : null,

//       to_date:
//         normalizedUserInput === 'Yes'
//           ? endOfDay(to_date)
//           : null
//     };


//     // --------------------------------------------------------
//     // Create Media Corner
//     // --------------------------------------------------------
//     const mediacorner =
//       await mediaCorner.create(mediaData);


//     logger.info(
//       `[${requestId}] Media Corner created: ${mediacorner._id}`
//     );


//     // --------------------------------------------------------
//     // Send notification
//     // --------------------------------------------------------
//     const User =
//       require('../models/User');


//     try {

//       const users = await User.find({

//         leader_regd_mobile_no:
//           leader_regd_mobile_no,

//         fcm_token: {
//           $exists: true,
//           $ne: null
//         }
//       });


//       for (const user of users) {

//         try {

//           await notificationService.sendNotification({

//             token: user.fcm_token,

//             title: 'New Media Added',

//             body: media_header,

//             type: 'media'
//           });

//         } catch (notificationError) {

//           logger.error(
//             `Notification failed for user ${user._id}: ${notificationError.message}`
//           );
//         }
//       }

//     } catch (notificationError) {

//       logger.error(
//         `Bulk notification failed: ${notificationError.message}`
//       );
//     }


//     // --------------------------------------------------------
//     // Response
//     // --------------------------------------------------------
//     return res.status(201).json({

//       message:
//         'Media Corner data created successfully',

//       data: mediacorner
//     });


//   } catch (error) {

//     logger.error(
//       `Media Corner creation error: ${error.message}`
//     );


//     // --------------------------------------------------------
//     // If DB creation failed after file upload,
//     // remove uploaded file.
//     // --------------------------------------------------------
//     if (req.file) {

//       try {

//         deleteFile(req.file.filename);

//       } catch (fileError) {

//         logger.error(
//           `Failed to delete uploaded file after error: ${fileError.message}`
//         );
//       }
//     }


//     return res.status(500).json({

//       error:
//         'Media Corner data creation failed',

//       details:
//         error.message
//     });
//   }
// };


// /**
//  * ============================================================
//  * GET MEDIA CORNER
//  *
//  * Query parameters:
//  *
//  * leader_regd_mobile_no
//  * media_type
//  * status = latest / history
//  *
//  * ============================================================
//  */
// exports.getMediaCorner = async (req, res, next) => {

//   const {
//     leader_regd_mobile_no,
//     media_type,
//     status = 'latest'
//   } = req.query;


//   const requestId =
//     req.requestId || 'N/A';


//   const hostUrl =
//     process.env.HOST_URL;


//   logger.info(
//     `[${requestId}] getMediaCorner -> leader=${leader_regd_mobile_no}, media_type=${media_type}, status=${status}`
//   );


//   // --------------------------------------------------------
//   // Validation
//   // --------------------------------------------------------
//   if (
//     !leader_regd_mobile_no ||
//     !media_type
//   ) {

//     return res.status(400).json({

//       error:
//         'Missing required parameters: leader_regd_mobile_no and/or media_type'
//     });
//   }


//   // --------------------------------------------------------
//   // Validate status
//   // --------------------------------------------------------
//   if (
//     status !== 'latest' &&
//     status !== 'history'
//   ) {

//     return res.status(400).json({

//       error:
//         'Invalid status. Use latest or history'
//     });
//   }


//   try {

//     const today =
//       startOfDay(new Date());


//     let query = {

//       leader_regd_mobile_no,

//       media_type
//     };


//     // ========================================================
//     // LATEST
//     // ========================================================
//     if (status === 'latest') {

//       query.$or = [

//         // ----------------------------------------------------
//         // Case 1:
//         // user_input = No
//         //
//         // Created date + 30 days
//         // ----------------------------------------------------
//         {
//           user_input: 'No',

//           $expr: {

//             $gte: [

//               {
//                 $dateAdd: {

//                   startDate: '$createdAt',

//                   unit: 'day',

//                   amount: 30
//                 }
//               },

//               today
//             ]
//           }
//         },


//         // ----------------------------------------------------
//         // Case 2:
//         // user_input = Yes
//         //
//         // Today must be between from_date and to_date
//         // ----------------------------------------------------
//         {
//           user_input: 'Yes',

//           from_date: {
//             $lte: endOfDay(new Date())
//           },

//           to_date: {
//             $gte: today
//           }
//         }
//       ];
//     }


//     // ========================================================
//     // HISTORY
//     // ========================================================
//     if (status === 'history') {

//       query.$or = [

//         // ----------------------------------------------------
//         // Case 1:
//         // user_input = No
//         //
//         // More than 30 days old
//         // ----------------------------------------------------
//         {
//           user_input: 'No',

//           $expr: {

//             $lt: [

//               {
//                 $dateAdd: {

//                   startDate: '$createdAt',

//                   unit: 'day',

//                   amount: 30
//                 }
//               },

//               today
//             ]
//           }
//         },


//         // ----------------------------------------------------
//         // Case 2:
//         // user_input = Yes
//         //
//         // to_date has already passed
//         // ----------------------------------------------------
//         {
//           user_input: 'Yes',

//           to_date: {
//             $lt: today
//           }
//         }
//       ];
//     }


//     // --------------------------------------------------------
//     // Latest date first
//     // --------------------------------------------------------
//     const records =
//       await mediaCorner
//         .find(query)
//         .sort({
//           createdAt: -1
//         });


//     if (
//       !records ||
//       records.length === 0
//     ) {

//       return res.status(200).json([]);
//     }


//     // --------------------------------------------------------
//     // Construct media URL
//     // --------------------------------------------------------
//     const updatedRecords =
//       records.map((record) => {

//         const obj =
//           record.toObject();


//         if (
//           obj.media_file &&
//           obj.media_file !== 'null'
//         ) {

//           obj.media_file_url =
//             `${hostUrl}/media/${obj.media_file}`;

//         } else {

//           obj.media_file_url =
//             null;
//         }


//         // ----------------------------------------------------
//         // Useful for frontend
//         // ----------------------------------------------------
//         if (obj.user_input === 'Yes') {

//           const todayStart =
//             startOfDay(new Date());

//           const toDate =
//             obj.to_date
//               ? startOfDay(obj.to_date)
//               : null;


//           obj.is_date_expired =
//             toDate
//               ? todayStart > toDate
//               : false;

//         } else {

//           obj.is_date_expired = false;
//         }


//         return obj;
//       });


//     return res.status(200).json(
//       updatedRecords
//     );


//   } catch (error) {

//     logger.error(
//       `[${requestId}] Error fetching Media Corner: ${error.message}`,
//       {
//         stack: error.stack
//       }
//     );

//     return next(error);
//   }
// };


// /**
//  * ============================================================
//  * GET MEDIA CORNER IMAGE / VIDEO
//  * ============================================================
//  */
// exports.getMediaCornerImage =
//   (req, res, next) => {

//     const filename =
//       req.query.media_file;


//     if (!filename) {

//       return res.status(400).json({

//         message:
//           'media_file is required'
//       });
//     }


//     const filePath =
//       path.join(
//         process.cwd(),
//         'uploads',
//         'media_corner',
//         filename
//       );


//     console.log(
//       'Media file path:',
//       filePath
//     );


//     fs.access(
//       filePath,
//       fs.constants.F_OK,
//       (err) => {

//         if (err) {

//           console.error(
//             'Media file not found:',
//             filePath
//           );

//           return res.status(404).json({

//             message:
//               'Media file not found or access denied'
//           });
//         }


//         console.log(
//           'Media file found:',
//           filePath
//         );


//         const stream =
//           fs.createReadStream(filePath);


//         stream.on(
//           'error',
//           (streamError) => {

//             console.error(
//               'Error streaming media:',
//               streamError.message
//             );


//             if (!res.headersSent) {

//               return res.status(500).json({

//                 message:
//                   'Error streaming media file'
//               });
//             }


//             return next(streamError);
//           }
//         );


//         stream.pipe(res);
//       }
//     );
//   };


// /**
//  * ============================================================
//  * UPDATE MEDIA CORNER
//  * ============================================================
//  */
// exports.updateMediaCorner =
//   async (req, res) => {

//     try {

//       const {
//         id,
//         user_input,
//         custom_text,
//         from_date,
//         to_date
//       } = req.body;


//       if (!id) {

//         return res.status(400).json({

//           error:
//             'Media Corner id is required'
//         });
//       }


//       // ------------------------------------------------------
//       // Role check
//       // ------------------------------------------------------
//       if (req.user_type === 'user') {

//         return res.status(403).json({

//           status: 'error',

//           message:
//             'Alert! Action forbidden'
//         });
//       }


//       // ------------------------------------------------------
//       // Find existing record
//       // ------------------------------------------------------
//       const existing =
//         await mediaCorner.findOne({
//           _id: id
//         });


//       if (!existing) {

//         return res.status(404).json({

//           error:
//             'Media Data not found',

//           id
//         });
//       }


//       const updatePayload = {
//         ...req.body
//       };


//       // ------------------------------------------------------
//       // Normalize user_input
//       // ------------------------------------------------------
//       const normalizedUserInput =
//         normalizeUserInput(
//           user_input !== undefined
//             ? user_input
//             : existing.user_input
//         );


//       updatePayload.user_input =
//         normalizedUserInput;


//       // ------------------------------------------------------
//       // If Yes
//       // ------------------------------------------------------
//       if (normalizedUserInput === 'Yes') {

//         const finalCustomText =
//           custom_text !== undefined
//             ? custom_text
//             : existing.custom_text;


//         const finalFromDate =
//           from_date !== undefined
//             ? from_date
//             : existing.from_date;


//         const finalToDate =
//           to_date !== undefined
//             ? to_date
//             : existing.to_date;


//         if (
//           !finalCustomText ||
//           !finalCustomText.trim()
//         ) {

//           return res.status(400).json({

//             error:
//               'custom_text is required when user_input is Yes'
//           });
//         }


//         if (!finalFromDate || !finalToDate) {

//           return res.status(400).json({

//             error:
//               'from_date and to_date are required when user_input is Yes'
//           });
//         }


//         const fromDate =
//           startOfDay(finalFromDate);


//         const toDate =
//           endOfDay(finalToDate);


//         if (fromDate > toDate) {

//           return res.status(400).json({

//             error:
//               'from_date cannot be greater than to_date'
//           });
//         }


//         updatePayload.custom_text =
//           finalCustomText.trim();


//         updatePayload.from_date =
//           fromDate;


//         updatePayload.to_date =
//           toDate;
//       }


//       // ------------------------------------------------------
//       // If No
//       // ------------------------------------------------------
//       if (normalizedUserInput === 'No') {

//         updatePayload.custom_text = null;

//         updatePayload.from_date = null;

//         updatePayload.to_date = null;
//       }


//       // ------------------------------------------------------
//       // File handling
//       // ------------------------------------------------------
//       if (req.file) {

//         updatePayload.media_file =
//           req.file.filename;

//       } else {

//         // Keep old file
//         updatePayload.media_file =
//           existing.media_file;
//       }


//       // ------------------------------------------------------
//       // Update
//       // ------------------------------------------------------
//       const updatedMedia =
//         await mediaCorner.findOneAndUpdate(

//           {
//             _id: id
//           },

//           updatePayload,

//           {
//             new: true,

//             runValidators: true
//           }
//         );


//       // ------------------------------------------------------
//       // Delete old file only after DB update
//       // ------------------------------------------------------
//       if (
//         req.file &&
//         existing.media_file &&
//         existing.media_file !== req.file.filename
//       ) {

//         deleteFile(
//           existing.media_file
//         );
//       }


//       return res.status(200).json({

//         message:
//           'Media Corner updated successfully',

//         data:
//           updatedMedia
//       });


//     } catch (error) {

//       logger.error(
//         `Media Corner update failed: ${error.message}`
//       );


//       return res.status(400).json({

//         error:
//           'Media Corner update failed',

//         details:
//           error.message
//       });
//     }
//   };


// /**
//  * ============================================================
//  * DELETE MEDIA CORNER
//  * ============================================================
//  */
// exports.deleteMediaCornerImage =
//   async (req, res, next) => {

//     const {
//       leader_regd_mobile_no,
//       id
//     } = req.query;


//     const requestId =
//       req.requestId || 'N/A';


//     const userId =
//       req.headers['x-user-id'] ||
//       'anonymous';


//     try {

//       if (!id) {

//         return res.status(400).json({

//           error:
//             'Media Corner id is required'
//         });
//       }


//       // IMPORTANT:
//       // findOneAndDelete gives us the actual document,
//       // unlike deleteOne()
//       const profile =
//         await mediaCorner.findOneAndDelete({
//           _id: id
//         });


//       if (!profile) {

//         logger.warn(
//           `[${requestId}] Media Corner not found for delete: ${id}`
//         );


//         return res.status(404).json({

//           error:
//             'Media Corner data not found'
//         });
//       }


//       // ------------------------------------------------------
//       // Delete physical file
//       // ------------------------------------------------------
//       if (
//         profile.media_file &&
//         profile.media_file !== 'null'
//       ) {

//         deleteFile(
//           profile.media_file
//         );


//         await logFileChange({

//           leader_regd_mobile_no:
//             leader_regd_mobile_no ||
//             profile.leader_regd_mobile_no,

//           action:
//             'Deleted',

//           filename:
//             profile.media_file,

//           field:
//             'media_file',

//           requestId,

//           userId
//         });

//       } else {

//         console.log(
//           'No Media File found to delete'
//         );
//       }


//       logger.info(
//         `[${requestId}] Media Corner deleted: ${id}`
//       );


//       return res.status(200).json({

//         message:
//           'Media Corner data deleted'
//       });


//     } catch (error) {

//       logger.error(
//         `[${requestId}] Media Corner delete error: ${error.message}`
//       );


//       return next(error);
//     }
//   };




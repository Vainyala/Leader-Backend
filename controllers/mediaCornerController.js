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
    // Send notification
    // --------------------------------------------------------
    const User =
      require('../models/User');


    try {

      const users = await User.find({

        leader_regd_mobile_no:
          leader_regd_mobile_no,

        fcm_token: {
          $exists: true,
          $ne: null
        }
      });


      for (const user of users) {

        try {

          await notificationService.sendNotification({

            token: user.fcm_token,

            title: 'New Media Added',

            body: media_header,

            type: 'media'
          });

        } catch (notificationError) {

          logger.error(
            `Notification failed for user ${user._id}: ${notificationError.message}`
          );
        }
      }

    } catch (notificationError) {

      logger.error(
        `Bulk notification failed: ${notificationError.message}`
      );
    }


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
















// // Date: 10 Oct 2025: 12:30 O'Clock
// // Onbord Telagana Express - Secunderbd to New Delhi

// // Controller to handle logic for image/video - upload/fetch/delete tasks
// // Coverage: Press Meets, Past Events, Upcoming Events
// // Logic: Generic code to handle any image/video, identified by media_type

// const LeaderCoordinates = require('../models/LeaderCoordinates');

// const fs = require('fs');
// const path = require('path');
// const logger = require('../utils/logger');
// const { logFileChange } = require('../utils/auditLogger');
// const mediaCorner = require('../models/mediaCorner');
// const notificationService = require('../services/notificationService');
// // 🧹 Helper to delete file from disk
// const deleteFile = (relativePath) => {
//   const fullPath = path.join(__dirname, '..', 'uploads', 'media_corner', relativePath);
//   if (fs.existsSync(fullPath)) {
//     fs.unlinkSync(fullPath);
//     logger.info(` Deleted file: ${relativePath}`);
//   }
// };

// //=============================================================
// exports.createMediaCorner = async (req, res) => {

//   let status_code = 400;
//   const requestId = req.requestId || 'N/A';

//   try {
//     console.log('createMediaCorner:-> Request Body:', req.body);
//     console.log('createMediaCorner:-> Request File:', req.file);

//     const {
//       leader_regd_mobile_no,
//       media_header,
//       media_narration,
//       media_url,
//       media_type,
//       media_file,
//       custom_text,
//       user_input
//     } = req.body;

//     console.log('createMediaCorner: media_file: ', media_file);

//     // if ( !leader_regd_mobile_no || !media_header || !media_narration || !media_url || !media_type || !media_file )
//     if (!leader_regd_mobile_no || !media_header || !media_narration || !media_type) {
//       return res.status(400).json({ message: 'createMediaCorner :-> Missing params, check and try again' });
//     } else {
//       console.log(' Body Params loaded successfully');
//     }
//     if (
//       media_type === 'LN' &&
//       user_input === 'yes' &&
//       (!custom_text || !custom_text.trim())
//     ) {
//       return res.status(400).json({
//         message:
//           'custom_text is required when media_type is LN and user_input is yes'
//       });
//     }
//     console.log(
//       "Role check:",
//       req.user_type,
//       "User ID:",
//       req.user?.userId
//     );
//     if (req.user_type === 'user') {
//       return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
//     }
// const mediaFilePath = req.file ? req.file.filename : null;
//     const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
//     console.log('createMediaCorner: Leader Master Record fetched: ', exists);
//     if (!exists) {
//       //logger.warn(`[${requestId}] Create failed: No master found for ${data.leader_regd_mobile_no}`);
//       logger.warn(`Create failed: No master found for ${leader_regd_mobile_no}`);
//       return res.status(404).json({ error: 'Leader not found in master records' });
//     }

//     const mediacorner = await mediaCorner.create({
//       leader_regd_mobile_no,
//       media_header,
//       media_narration,
//       media_url,
//       media_type,
//       media_file,
//       custom_text,
//       user_input
//     });

//     await mediacorner.save();

//     const User = require('../models/User');
    

//     try {

//       const users = await User.find({
//         leader_regd_mobile_no: leader_regd_mobile_no,
//         fcm_token: {
//           $exists: true,
//           $ne: null
//         }
//       });

//       for (const user of users) {

//         try {

//           await notificationService.sendNotification({
//             token: user.fcm_token,
//             title: "New Media Added",
//             body: media_header,
//             type: "media"
//           });

//         } catch (err) {
//           console.log(
//             `Failed for user ${user._id}:`,
//             err.message
//           );
//         }
//       }

//     } catch (notifErr) {
//       console.log(
//         "Bulk notification failed:",
//         notifErr.message
//       );
//     }

//     logger.info(`Media Corner data created for ${mediacorner.leader_regd_mobile_no}`);
//     //logger.info(`[${requestId}] Media Corner data created for ${mediacorner.leader_regd_mobile_no}`);
//     res.status(201).json({ message: 'Media Corner data created' });
//   } catch (err) {
//     logger.error(`Media Corner Data creation error: ${err.message}`);
//     // Note: Implement logic to delete uplodaed media file if error was thrown during updating MongoDB data
//     // As media file uploads first and then controller code runs
//     //next(err);
//   }

// };


// exports.getMediaCorner = async (req, res, next) => {
//   const { leader_regd_mobile_no: leader_regd_mobile_no, media_type } = req.query;
//   const requestId = req.requestId || 'N/A';
//   const hostUrl = `${process.env.HOST_URL}`;

//   logger.info(`[${requestId}] getMediaCorner invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}, media_type: ${media_type}`);
//   logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

//   if (!leader_regd_mobile_no || !media_type) {
//     logger.warn(`[${requestId}] Missing required query parameters`);
//     return res.status(400).json({ error: 'Missing required parameters: leader_regd_mobile_no and/or media_type' });
//   }

//   try {
//     const records = await mediaCorner.find({ leader_regd_mobile_no, media_type });

//     if (!records || records.length === 0) {
//       logger.warn(`[${requestId}] No Media Corner data found for ${leader_regd_mobile_no}`);
//       return res.status(404).json({ error: 'Media Corner data not found' });
//     }

//     logger.info(`[${requestId}] ${records.length} Media Corner records fetched`);

//     // Implemented on 12/09/2025
//     const updatedRecords = records.map((record) => {
//       const obj = record.toObject();
//       const { media_file } = obj;

//       if (media_file && media_file !== 'null') {
//         obj.media_file_url = `${hostUrl}/media/${media_file}`;
//         logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.media_file_url}`);
//       } else {
//         obj.media_file_url = 'null';
//         logger.warn(`[${requestId}] Attachment is not found for record ID: ${record._id}`);
//       }

//       return obj;
//     });


//     /* Commented on 12/09/2025...
//         const updatedRecords = records.map((record) => {
//           const { media_file, _id: recordId } = record;
    
//           if (media_file && media_file !== 'null') {
//             record.media_file = `${hostUrl}/media/${media_file}`;
//             logger.debug(`[${requestId}] Media file URL constructed for record ${recordId}: ${record.media_file}`);
//             logger.info(`[${requestId}] Media file URL constructed for record ${recordId}: ${record.media_file}`);
//           } else {
//             record.media_file = 'null';
//             logger.warn(`[${requestId}] No media file found for record ID: ${recordId}`);
//           }
    
//           const updated = record.toObject();
//           updated.media_file = record.media_file;
//           return updated;
//         });
//     */
//     logger.info(`[${requestId}] Media Corner response prepared for ${leader_regd_mobile_no}`);
//     return res.status(200).json(updatedRecords);
//   } catch (error) {
//     logger.error(`[${requestId}] Error fetching Media Corner data: ${error.message}`, { stack: error.stack });
//     return next(error);
//   }
// };

// /*
// 21/11/2025
// Streaming is the right move for large video files because res.sendFile will try to buffer 
// the whole file before sending, which can be inefficient. With fs.createReadStream, 
// you stream chunks directly to the client, saving memory and improving performance.
// Sp commented the below code using res.sedFile and used fs.createReadStream in the next section
// */
// // Get Media Corner Image/Video
// /*

// exports.getMediaCornerImage = (req, res, next) => {
//   const filename = req.query.media_file;
//   console.log('getMediaCornerImage......', filename);

//   const currentWorkingDir = process.cwd();
//   const imagePath = path.join(currentWorkingDir, 'uploads', 'media_corner', filename);

//   console.log('getMediaCornerAsset API:-> Final ImagePath: ', imagePath);

//   // Check if file exists first
//   fs.access(imagePath, fs.constants.F_OK, err => {
//     if (err) {
//       console.error('Image/Video File not found:', imagePath);
//       return res.status(404).json({ message: 'Media file not found or access denied' });
//     }

//     console.log('\nImage/Video File found:', imagePath);

//     // Only send file if it exists
//     res.sendFile(imagePath, err => {
//       if (err) {
//         console.error('Error sending media file:', err.message);
//         if (!res.headersSent) {
//           return res.status(500).json({ message: 'Error sending media file' });
//         }
//         return next(err);
//       }
//     });
//   });
// };
// */

// // 21/11/2025 
// /*
// fs.createReadStream: streams file in chunks, avoids loading entire file into memory.
// Error handling: listen for stream.on('error') to catch read errors.
// Response piping: stream.pipe(res) sends data directly to client.
// Scalable: works well for large video/audio files, supports partial delivery.
// */
// exports.getMediaCornerImage = (req, res, next) => {
//   const filename = req.query.media_file;
//   console.log('getMediaCornerImage......', filename);

//   const currentWorkingDir = process.cwd();
//   const filePath = path.join(currentWorkingDir, 'uploads', 'media_corner', filename);

//   console.log('getMediaCornerAsset API:-> Final FilePath: ', filePath);

//   // Check if file exists first
//   fs.access(filePath, fs.constants.F_OK, err => {
//     if (err) {
//       console.error('Media file not found:', filePath);
//       return res.status(404).json({ message: 'Media file not found or access denied' });
//     }

//     console.log('Media file found:', filePath);

//     // Stream the file
//     const stream = fs.createReadStream(filePath);

//     stream.on('error', err => {
//       console.error('Error streaming media file:', err.message);
//       if (!res.headersSent) {
//         return res.status(500).json({ message: 'Error streaming media file' });
//       }
//       return next(err);
//     });

//     // Pipe stream to response
//     stream.pipe(res);
//   });
// };


// //Update media corner: Content and / or asset (image/video)
// exports.updateMediaCorner = async (req, res) => {
//   try {
//     const filename = req.body.media_file;
//     const id = req.body.id;

//     const updatePayload = req.body;

//     console.log('updateMediaCorner:  Request Body: ', updatePayload);

//     if (!filename) {
//       const data = await mediaCorner.findOne(
//         { _id: id },
//       );

//       if (!data) {
//         return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
//       }

//       updatePayload.media_file = data.media_file;
//       console.log('No Media File uploaded, existing media file remain untouched: ', updatePayload.media_file);
//       //return res.status(400).json({ error: 'No Media File uploaded' });
//     }

//     if (req.user_type === 'user') {
//       return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
//     }

//     const updatedMedia = await mediaCorner.findOneAndUpdate(
//       { _id: id },
//       updatePayload,
//       { new: true, runValidators: true }
//     );

//     if (!updatedMedia) {
//       return res.status(404).json({ error: 'Media Data not found for given Media File Id', id });
//     }

//     res.status(200).json({
//       message: 'Media File updated successfully',
//       Media_File: updatePayload.media_file
//     });
//   } catch (error) {
//     res.status(400).json({
//       error: 'Media File update failed',
//       details: error.message
//     });
//   }
// };





// // Delete image
// exports.deleteMediaCornerImage = async (req, res, next) => {
//   console.log('deleteMediaCornerImage: req.query: ', req.query);
//   const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
//   const id = req.query.id;
//   const requestId = req.requestId || 'N/A';
//   const userId = req.headers['x-user-id'] || 'anonymous';

//   try {
//     const profile = await mediaCorner.deleteOne({ _id: id });
//     //console.log('Media Corner data fetched: ', profile);
//     if (!profile.deletedCount) {
//       logger.warn(`[${requestId}] Media Corner data not found to delete  ${leader_regd_mobile_no}`);
//       return res.status(404).json({ error: 'Media Corner data not found' });
//     } else {
//       console.log('deleteMediaCorner: profile fetched: ', profile);
//     }

//     fname = profile.media_file;

//     if (fname) {
//       deleteFile(profile.media_file);
//       await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.media_file, field: 'media_file', requestId, userId });
//     } else {
//       console.log('deleteMediaCorner: No Media File found to Delete....');
//     }

//     logger.info(`[${requestId}] Media Corner data deleted for ${leader_regd_mobile_no}`);
//     res.status(200).json({ message: 'Media Corner data deleted' });
//   } catch (err) {
//     logger.error(`[${requestId}] Media Corner image delete error: ${err.message}`);
//     next(err);
//   }
// };














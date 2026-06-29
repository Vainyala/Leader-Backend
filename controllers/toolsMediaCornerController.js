// Date: 10 Oct 2025: 12:30 O'Clock
// Onbord Telagana Express - Secunderbd to New Delhi

// Controller to handle logic for image/video - upload/fetch/delete tasks
// Coverage: Press Meets, Past Events, Upcoming Events
// Logic: Generic code to handle any image/video, identified by media_type

const LeaderCoordinates = require('../models/LeaderCoordinates');

const fs = require('fs');
const path = require('path');
const ConstituencyProfile = require('../models/mediaCorner');
const logger = require('../utils/logger');
const { logFileChange } = require('../utils/auditLogger');
const mediaCorner = require('../models/mediaCorner');

//  Helper to delete file from disk
const deleteFile = (relativePath) => {
  const fullPath = path.join(__dirname, '..', 'uploads', 'media_corner', relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.info(` Deleted file: ${relativePath}`);
  }
};
//=============================================================
exports.createMediaCorner = async (req, res) => {

  let status_code = 400;
  const requestId = req.requestId || 'N/A';
  
  try {
    console.log('createMediaCorner:-> Request Body:', req.body);
    console.log('createMediaCorner:-> Request File:', req.file);

    const { 
      media_header,
      media_narration,
      media_url,
      media_type,
      media_file
    } = req.body;

    console.log('createMediaCorner: media_file: ', media_file);

   // if ( !leader_regd_mobile_no || !media_header || !media_narration || !media_url || !media_type || !media_file )
    if ( !media_header || !media_narration || !media_type )
    {
      return res.status(400).json({ message: 'createMediaCorner :-> Missing params, check and try again' });
    } else {
      console.log(' Body Params loaded successfully');
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }
    
    const mediacorner = await mediaCorner.create({
      media_header,
      media_narration,
      media_url,
      media_type,
      media_file
    });

    await mediacorner.save();
      
    logger.info(`Media Corner data created for ${mediacorner.}`);
    //logger.info(`[${requestId}] Media Corner data created for ${mediacorner.}`);
    res.status(201).json({ message: 'Media Corner data created' });
  } catch (err) {
    logger.error(`Media Corner Data creation error: ${err.message}`);
    // Note: Implement logic to delete uplodaed media file if error was thrown during updating MongoDB data
    // As media file uploads first and then controller code runs
    //next(err);
  }

  };


exports.getMediaCorner = async (req, res, next) => {
  const { leader_regd_mobile_no: leader_regd_mobile_no, media_type } = req.query;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}`;

  logger.info(`[${requestId}] getMediaCorner invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}, media_type: ${media_type}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  if (!leader_regd_mobile_no || !media_type) {
    logger.warn(`[${requestId}] Missing required query parameters`);
    return res.status(400).json({ error: 'Missing required parameters: leader_regd_mobile_no and/or media_type' });
  }

  try {
    const records = await mediaCorner.find({ leader_regd_mobile_no, media_type });

    if (!records || records.length === 0) {
      logger.warn(`[${requestId}] No Media Corner data found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Media Corner data not found' });
    }

    logger.info(`[${requestId}] ${records.length} Media Corner records fetched`);

    // Implemented on 12/09/2025
  const updatedRecords = records.map((record) => {
      const obj = record.toObject();
      const { media_file } = obj;

      if (media_file && media_file !== 'null') {
        obj.media_file_url = `${hostUrl}/media/${media_file}`;
        logger.debug(`[${requestId}] Attachment URL constructed for record ${record._id}: ${obj.media_file_url}`);
      } else {
        obj.media_file_url = 'null';
        logger.warn(`[${requestId}] Attachment is not found for record ID: ${record._id}`);
      }

      return obj;
    });


/* Commented on 12/09/2025...
    const updatedRecords = records.map((record) => {
      const { media_file, _id: recordId } = record;

      if (media_file && media_file !== 'null') {
        record.media_file = `${hostUrl}/media/${media_file}`;
        logger.debug(`[${requestId}] Media file URL constructed for record ${recordId}: ${record.media_file}`);
        logger.info(`[${requestId}] Media file URL constructed for record ${recordId}: ${record.media_file}`);
      } else {
        record.media_file = 'null';
        logger.warn(`[${requestId}] No media file found for record ID: ${recordId}`);
      }

      const updated = record.toObject();
      updated.media_file = record.media_file;
      return updated;
    });
*/
    logger.info(`[${requestId}] Media Corner response prepared for ${leader_regd_mobile_no}`);
    return res.status(200).json(updatedRecords);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching Media Corner data: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};

// 21/11/2025 
/*
fs.createReadStream: streams file in chunks, avoids loading entire file into memory.
Error handling: listen for stream.on('error') to catch read errors.
Response piping: stream.pipe(res) sends data directly to client.
Scalable: works well for large video/audio files, supports partial delivery.
*/
exports.getMediaCornerImage = (req, res, next) => {
  const filename = req.query.media_file;
  console.log('getMediaCornerImage......', filename);

  const currentWorkingDir = process.cwd();
  const filePath = path.join(currentWorkingDir, 'uploads', 'media_corner', filename);

  console.log('getMediaCornerAsset API:-> Final FilePath: ', filePath);

  // Check if file exists first
  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      console.error('Media file not found:', filePath);
      return res.status(404).json({ message: 'Media file not found or access denied' });
    }

    console.log('Media file found:', filePath);

    // Stream the file
    const stream = fs.createReadStream(filePath);

    stream.on('error', err => {
      console.error('Error streaming media file:', err.message);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error streaming media file' });
      }
      return next(err);
    });

    // Pipe stream to response
    stream.pipe(res);
  });
};


//Update media corner: Content and / or asset (image/video)
exports.updateMediaCorner = async (req, res) => {
  try {
    const filename = req.body.media_file;
    const id = req.body.id;

    const updatePayload = req.body;

    console.log('updateMediaCorner:  Request Body: ', updatePayload );

    if (!filename) {
      const data = await mediaCorner.findOne(
        {  _id: id },
      );

      if (!data) {
        return res.status(404).json({ error: 'Media Data not found for given Media Id', id });
      }

      updatePayload.media_file = data.media_file;
      console.log('No Media File uploaded, existing media file remain untouched: ', updatePayload.media_file );
      //return res.status(400).json({ error: 'No Media File uploaded' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const updatedMedia = await mediaCorner.findOneAndUpdate(
      {  _id: id },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedMedia) {
      return res.status(404).json({ error: 'Media Data not found for given Media File Id', id });
    }

    res.status(200).json({
      message: 'Media File updated successfully',
      Media_File: updatePayload.media_file
    });
  } catch (error) {
    res.status(400).json({
      error: 'Media File update failed',
      details: error.message
    });
  }
};





// Delete image
exports.deleteMediaCornerImage = async (req, res, next) => {
  console.log('deleteMediaCornerImage: req.query: ', req.query);
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const id = req.query.id;
  const requestId = req.requestId || 'N/A';
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    const profile = await mediaCorner.deleteOne({ _id: id});
    //console.log('Media Corner data fetched: ', profile);
    if ( !profile.deletedCount ) {
      logger.warn(`[${requestId}] Media Corner data not found to delete  ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Media Corner data not found' });
    } else {
      console.log('deleteMediaCorner: profile fetched: ', profile);
    }

    fname = profile.media_file;

    if (fname) {
      deleteFile(profile.media_file);
      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.media_file, field: 'media_file', requestId, userId });
    } else {
      console.log('deleteMediaCorner: No Media File found to Delete....');
    }

    logger.info(`[${requestId}] Media Corner data deleted for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Media Corner data deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Media Corner image delete error: ${err.message}`);
    next(err);
  }
};

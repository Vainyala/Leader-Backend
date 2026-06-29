// Date: 10 Oct 2025: 12:30 O'Clock
// Onbord Telagana Express - Secunderbd to New Delhi

// Controller to handle logic for image/video - upload/fetch/delete tasks
// Coverage: Press Meets, Past Events, Upcoming Events
// Logic: Generic code to handle any documents

const LeaderCoordinates = require('../models/LeaderCoordinates');

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { logFileChange } = require('../utils/auditLogger');
const leaderDocument = require('../models/LeaderDocuments');

//  Helper to delete file from disk
const deleteFile = (relativePath) => {
  const fullPath = path.join(__dirname, '..', 'uploads', 'leader_documents', relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.info(` Deleted file: ${relativePath}`);
  }
};


//=============================================================
exports.uploadLeaderDocument = async (req, res) => {
  const requestId = req.requestId || 'N/A';
  let status_code = 400;
  try {
    console.log('uploadLeaderDocument:-> Request Body:', req.body);
    console.log('uploadLeaderDocument:-> Request File:', req.file);

    const { 
      leader_regd_mobile_no,
      document_header,
      document_narration,
      document_url,
      document_type,
      document_file
    } = req.body;

    console.log('uploadLeaderDocument: Document File: ', document_file);

    if ( !leader_regd_mobile_no || !document_header || !document_narration || !document_url || !document_type || !document_file )
    {
      return res.status(400).json({ message: 'uploadLeaderDocument :-> Missing params, check and try again' });
    } else {
      console.log(' Body Params loaded successfully');
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }
        
    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!exists) {
      //logger.warn(`[${requestId}] Create failed: No master found for ${data.leader_regd_mobile_no}`);
      logger.warn(`Upload failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const document = await leaderDocument.create({
      leader_regd_mobile_no,
      document_header,
      document_narration,
      document_url,
      document_type,
      document_file
    });

    await document.save();
      
    logger.info(`Document updated for ${document.leader_regd_mobile_no}`);
    res.status(201).json({ message: 'Document file uploaded successfully' });
  } catch (err) {
    logger.error(`Leader Document Upload error: ${err.message}`);
    // Note: Implement logic to delete uplodaed document file if error was thrown during updating MongoDB data
    // As document file uploads first and then controller code runs
    //next(err);
  }

  };


exports.getLeaderDocuments = async (req, res, next) => {
  const { leader_regd_mobile_no: leader_regd_mobile_no, document_type } = req.query;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}`;

  logger.info(`[${requestId}] getLeaderDocument invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}, document_type: ${document_type}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  if (!leader_regd_mobile_no || !document_type) {
    logger.warn(`[${requestId}] Missing required query parameters`);
    return res.status(400).json({ error: 'Missing required parameters: leader_regd_mobile_no and/or document_type' });
  }

  try {
    const records = await leaderDocument.find({ leader_regd_mobile_no, document_type });

    if (!records || records.length === 0) {
      logger.warn(`[${requestId}] Leader Document File not found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Document File not found' });
    }

    logger.info(`[${requestId}] ${records.length} Leader Document File fetched`);

    const updatedRecords = records.map((record) => {
      const { document_file, _id: recordId } = record;

      if (document_file && document_file !== 'null') {
        record.document_file = `${hostUrl}/document/${document_file}`;
        logger.debug(`[${requestId}] Document file URL constructed for record ${recordId}: ${record.document_file}`);
        logger.info(`[${requestId}] Document file URL constructed for record ${recordId}: ${record.document_file}`);
      } else {
        record.document_file = 'null';
        logger.warn(`[${requestId}] Document file is not found for record ID: ${recordId}`);
      }

      const updated = record.toObject();
      updated.document_file = record.document_file;
      return updated;
    });

    logger.info(`[${requestId}] Leader Document File response prepared for ${leader_regd_mobile_no}`);
    return res.status(200).json(updatedRecords);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching Leader Document: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


// Download Leader Document
exports.downloadLeaderDocument = (req, res) => {
  const filename = req.query.document_file;
  console.log('downloadLeaderDocument......', filename);
  const currentWorkingDir = process.cwd();

  const filePath = path.join(currentWorkingDir, 'uploads', 'leader_documents', filename);
  
  console.log('downloadLeaderDocument API:-> Final ImagePath: ', filePath);

  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error sending document file:', err.message);
      res.status(404).json({ message: 'Please check Document file not found or access denied' });
    }
  });
};

//Update Leader Document: Content -- Docx/PDF/TXT
exports.updateLeaderDocument = async (req, res) => {
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const filename = req.body.document_file;
    const id = req.body.id;

    const updatePayload = req.body;

    console.log('updateLeaderDocument:  Request Body: ', updatePayload );

    const data = await leaderDocument.findOne(
        {  _id: id },
    );

    if (!filename) {

      if (!data) {
        return res.status(404).json({ error: 'Document not found for the given Document Id', id });
      }

      updatePayload.document_file = data.document_file;
      console.log('updateLeaderDocument: Document not  uploaded, existing document file remain untouched: ', updatePayload.document_file );
      //return res.status(400).json({ error: 'No Document File uploaded' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const updatedDocument = await leaderDocument.findOneAndUpdate(
      {  _id: id },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: 'Document not found for given Document File Id', id });
    }

    console.log("Im before deleteFile. filename: ", data.document_file);

     // Delete old document file after updating with the new document file in MongoDB
    if (data.document_file) {
      deleteFile(data.document_file);
      console.log("Im within deleteFile.....");
      //await logFileChange({ leader_regd_mobile_no, action: 'Old Document Deleted'. data.document_file });
    } else {
      console.log('updateLeaderDocument: No Document found to Delete with Filename: ', data.document_file);
    }

    console.log("Im after deleteFile.....");

    res.status(200).json({
      message: 'Document updated successfully',
      Document: updatePayload.document_file
    });
  } catch (error) {
    res.status(400).json({
      error: 'Document update failed',
      details: error.message
    });
  }
};




// Delete image
exports.deleteLeaderDocument = async (req, res, next) => {
  console.log('deleteDocument: req.query: ', req.query);
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const id = req.query.id;
  const requestId = req.requestId || 'N/A';
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {

    // First check if the document found for the given _id
     const data = await leaderDocument.findOne(
        {  _id: id },
    );

    if (!data) {
       return res.status(404).json({ error: 'Document Data not found, Plz check and retry!' }); 
    }
    
    filename_to_delete = data.document_file;  // Assign the document file name to a variable

    // Now document receord is found, so delete it along with the document file
    
    const profile = await leaderDocument.deleteOne({ _id: id});
    //console.log('Document fetched: ', profile);
    if ( !profile.deletedCount ) {
      logger.warn(`[${requestId}] Document is not found to delete  ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Document not found' });
    } else {
      console.log('deleteLeaderDocument: profile fetched: ', profile);
    }

    console.log('deleteLeaderDocoument: Filename to delete: ', filename_to_delete);

    if (filename_to_delete) {
      deleteFile(filename_to_delete);
      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: filename_to_delete, field: 'Document', requestId, userId });
    } else {
      console.log('deleteLeaderDocument: No Document found to Delete....');
    }

    logger.info(`[${requestId}] Document deleted for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Document data deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Document delete error: ${err.message}`);
    next(err);
  }
};

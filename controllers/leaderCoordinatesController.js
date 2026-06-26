// controllers/leaderCoordinatesController.js

const { formatISTTimestamps } = require('../utils/timeFormatter');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const hasChildReferences = require('../utils/checkChildReferences');
const validateUserType = require('../utils/validateUserType');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 06/01/2026

// Get Leader Keys to be called during App Launch to store the leaders keys data

// GET
exports.fetchMembercoordinates = async (req, res, next) => {
  console.log('fetchMembercoordinates: Request Query:', req.query );
  leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId || 'N/A';
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;
  const field_to_update = 'updatedCoordinates';

  logger.info(`[${requestId}] fetchMembercoordinates invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);
  logger.info(`[${requestId}] Host URL resolved as: ${hostUrl}`);

  try {
    const data = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Leader coordinates not found for mobile ' + leader_regd_mobile_no });
    }

    const { leader_photo, _id: recordId } = data;

    if (leader_photo) {
      data.leader_photo = `${hostUrl}/leader/${leader_photo}`;
      logger.debug(`[${requestId}] Member image URL constructed: ${data.leader_photo}`);
      logger.info(`[${requestId}] Member image URL constructed: ${data.leader_photo}`);
    } else {
      logger.warn(`[${requestId}] No member image found for record ID: ${recordId}`);
    }

    logger.info(`[${requestId}] Successfully fetched Leader Coordinates Data for ${leader_regd_mobile_no}`);
    const formattedData = formatISTTimestamps(data);

    // Update tracker flag: updatedCoordinates = false for the given device
    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    // Update tracker flag: updatedLeaderImage = false for the given device
    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, 'updatedLeaderImage');

    res.status(200).json({ leader_coordinates: formattedData });
    
  } catch (error) {
    logger.error(`[${requestId}] Error fetching profile: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


// POST with leader_photo upload
exports.createMembercoordinates = async (req, res) => {

  let message = '';
  if (!req.body || Object.keys(req.body).length === 0) {
    console.warn(`validateAppKey: req.body is empty`, req.body);
    message = 'Missing leader_coordinates or leader_regd_mobile_no in request body';
    console.log(message);
    return res.status(400).json({ error: message });
  }

  
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const title = req.body.title;
    const  member_name = req.body.member_name;
    const  party = req.body.party;
    const  constituency = req.body.constituency;
    const  state = req.body.state;
    const  email_id = req.body.email_id;
    const  digital_sansad_url = req.body.digital_sansad_url;

    console.log('createMembercoordinates: User_Type: ', req.user_type, ' Request Body: ', req.body);

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const existing = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      message = 'Registered Mobile Number: '+ leader_regd_mobile_no +'  '+ 'Leader coordinates already exist for mobile ';

      return res.status(409).json({ error: message });
    }

    //const leader_photo = req.file ? req.file.filename : null;

    const newLeader = new LeaderCoordinates({
      leader_regd_mobile_no,
      title,
      member_name,
      party,
      constituency,
      state,
      email_id,
      digital_sansad_url,
      timestamp: new Date() // or let Mongoose default it
    });

    await newLeader.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCoordinates');

    const formattedData = formatISTTimestamps(newLeader);
    res.status(201).json({ message: 'Leader coordinates created', data: formattedData });
  } catch (err) {
    console.error('Error creating leader coordinates:', err);
    
    let status_code = 500;
    let message = err.message;

    if (err.code === 11000) {
        console.error('Error Code:', err.code, ' Error Message', err.message);
        status_code = 409;
        message = "Duplicate: Registered Mobile Number already exists, please try other!";
      } 
    res.status(status_code).json({ error: message });
  }
};

// PUT -- Update one or more details of Leader ccordinates
exports.updateMembercoordinates = async (req, res) => {

  console.log('updateMembercoordinates: Request Params:', req.body );

  if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  try {
    const payload = req.body.leader_coordinates;
    if (!payload) {
      return res.status(400).json({ error: 'Missing leader_coordinates in request body' });
    }

    const updated = await LeaderCoordinates.findOneAndUpdate(
      { leader_regd_mobile_no: leader_regd_mobile_no },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Leader coordinates not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCoordinates');
    
    const formattedData = formatISTTimestamps(updated);
    res.status(200).json({ message: 'Leader coordinates updated', leader_coordinates: formattedData});
  } catch (err) {
    console.error('Error updating leader coordinates:', err);
    res.status(500).json({ error: 'Internal server error while updating leader coordinates' });
  }
};

// DELETE
exports.deleteMembercoordinates = async (req, res) => {
  console.log('deleteMembercoordinates: Request Params:', req.params );
  const mobile = req.query.leader_regd_mobile_no.trim();

  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  try {

    //const found = await LeaderCoordinates.findOne({ regd_mobile_no: mobile });
    //console.log('Mobile Number Found:', found);

    const hasChildren = await hasChildReferences(mobile);
    if (hasChildren.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Oops! Cannot delete LeaderCoordinates of ${mobile}: Child records exist in ${hasChildren.join(', ')}`
      });
    }
    /*
    const hasChildren = await hasChildReferences(mobile);
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: `Oops! Cannot delete Leader with Regd Mobile No. ${mobile} — child records exist in related collections.`
      });
    }
*/
    const deleted = await LeaderCoordinates.findOneAndDelete({ leader_regd_mobile_no: mobile });
    if (!deleted) {
      console.warn(`No document found for mobile: ${req.params.mobile}`);
      return res.status(404).json({ error: 'Leader coordinates not found for mobile ' + mobile });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCoordinates');
    
    res.status(200).json({ message: 'Leader coordinates deleted' });
  } catch (err) {
    console.error('Error deleting leader coordinates:', err);
    res.status(500).json({ error: 'Internal server error while deleting leader coordinates' });
  }
};


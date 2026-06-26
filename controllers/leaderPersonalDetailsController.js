const { formatISTTimestamps } = require('../utils/timeFormatter');
const LeaderPersonalDetails = require('../models/LeaderPersonalDetails');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
exports.fetchPersonaldetails = async (req, res) => {
  console.log('fetchPersonaldetails: Request Query:', req.query );
  leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const field_to_update = 'updatedPersdet';

  try {
    const data = await LeaderPersonalDetails.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Personal Details data not found for mobile ' + leader_regd_mobile_no });
    }
    //new Date(data.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const formattedData = formatISTTimestamps(data);

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    
    res.status(200).json({ personal_details: formattedData });
  } catch (err) {
    console.error('Error fetching Personal details data:', err);
    res.status(500).json({ error: 'Internal server error while fetching Personal Details data' });
  }
};

exports.createPersonaldetails = async (req, res) => {
  console.log('createPersonaldetails: Request Body:', req.body );

  const requestId = req.requestId || 'N/A';
  let message = '';
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn(`createPersonalDetails: req.body is empty`, req.body);
      message = 'Missing leader_coordinates or leader_regd_mobile_no in request body';
      console.log(message);
      return res.status(400).json({ error: message });
    }

  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: req.body.leader_regd_mobile_no });
      if (!exists) {
        logger.warn(`[${requestId}] Create failed: No master found for ${req.body.leader_regd_mobile_no}`);
        return res.status(404).json({ error: 'Leader not found in master records' });
      }

    
    const {
      leader_regd_mobile_no,
      birth_place,
      dob,
      father_name,
      mother_name,
      profession
    } = req.body;

    const existing = await LeaderPersonalDetails.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Personal Details data already exists for mobile ' + leader_regd_mobile_no });
    }

  const data = new LeaderPersonalDetails({
      leader_regd_mobile_no,
      birth_place,
      dob,
      father_name,
      mother_name,
      profession,
      timestamp: new Date() // or let Mongoose default it
    });

    await data.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPersdet');

 
    const formattedData = formatISTTimestamps(data);
    res.status(201).json({ message: 'Personal Details data created', perosnal_details: formattedData });
  } catch (err) {
    if (err.message.includes('leader_regd_mobile_no') && err.message.includes('not found')) {
      return res.status(400).json({ error: 'Invalid leader_regd_mobile_no: no matching Leader Registered Mobile Number found in Leader Coordinates' });
    }
    console.error('Error creating Personal Details data:', err);
    res.status(500).json({ error: 'Internal server error while creating Personal Details data' });
  }
};

exports.updatePersonaldetails = async (req, res) => {
  console.log('updatePersonaldetails: Request Body:', req.body );

  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Missing personal_details in request body' });
    }

    const updated = await LeaderPersonalDetails.findOneAndUpdate(
      { leader_regd_mobile_no: req.body.leader_regd_mobile_no },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Personal Details data not found for mobile ' + req.params.mobile });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPersdet');

    const formattedData = formatISTTimestamps(updated);
    res.status(200).json({ message: 'Personal Details data updated', personal_details: formattedData });
  } catch (err) {
    console.error('Error updating Personal Details data:', err);
    res.status(500).json({ error: 'Internal server error while updating Personal Details data' });
  }
};

exports.deletePersonaldetails = async (req, res) => {
  console.log('deletePersonaldetails: Request Params:', req.query );

  if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  leader_regd_mobile_no = req.query.leader_regd_mobile_no;

  try {    
    const deleted = await LeaderPersonalDetails.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Personal Details data not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPersdet');
    
    res.status(200).json({ message: 'Personal Details data deleted' });
  } catch (err) {
    console.error('Error deleting Personal Details data:', err);
    res.status(500).json({ error: 'Internal server error while deleting Personal Details data' });
  }
};

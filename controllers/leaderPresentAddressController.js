const { formatISTTimestamps } = require('../utils/timeFormatter');
const LeaderPresentAddress = require('../models/LeaderPresentAddress');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
exports.fetchPresaddress = async (req, res) => {
  console.log('fetchPresaddress: Request Params:', req.query );
  leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const field_to_update = 'updatedPresadd';

  try {
    const data = await LeaderPresentAddress.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Present address not found for mobile ' + leader_regd_mobile_no });
    }

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    
    const formattedData = formatISTTimestamps(data);
    res.status(200).json({ present_address: formattedData });
  } catch (err) {
    console.error('Error fetching present address:', err);
    res.status(500).json({ error: 'Internal server error while fetching present address' });
  }
};

exports.createPresaddress = async (req, res) => {
  console.log('createPresaddress: Request Body:', req.body );
  const requestId = req.requestId || 'N/A';
  let message = '';
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn(`createPresaddress: req.body is empty`, req.body);
      message = 'Missing request body params';
      console.log(message);
      return res.status(400).json({ error: message });
    }

    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const payload = req.body.present_address;
    
    if (!payload || !leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Missing pres_address or leader_regd_mobile_no in request body' });
    }

    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
      if (!exists) {
         logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
         return res.status(404).json({ error: 'Leader not found in master records' });
       }
    
    const existing = await LeaderPresentAddress.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Present address already exists for mobile ' + leader_regd_mobile_no });
    }

    payload.leader_regd_mobile_no = leader_regd_mobile_no;

    console.log('createConstituencyProfile: Final payload:', payload);

    const data = new LeaderPresentAddress(payload);
    await data.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPresadd');

    const formattedData = formatISTTimestamps(data);
    res.status(201).json({ message: 'Present address created', present_address: formattedData });
  } catch (err) {
    console.log('createPresaddress: Raw Error:', err.message);

    if (err.message.includes('leader_regd_mobile_no') && err.message.includes('not found')) {
      return res.status(400).json({ error: 'Invalid leader_regd_mobile_no: no matching Leader Registered Mobile Number found in Leader Coordinates' });
    }
    console.error('Error creating present address:', err);
    res.status(500).json({ error: 'Internal server error while creating present address' });
  }
};

// Method: PUT
exports.updatePresaddress = async (req, res) => {
  console.log('updatePresaddress: Request Body:', req.body );
  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }
  leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  try {
    const payload = req.body.present_address;
    if (!payload) {
      return res.status(400).json({ error: 'Missing pres_address in request body' });
    }

    const updated = await LeaderPresentAddress.findOneAndUpdate(
      { leader_regd_mobile_no: leader_regd_mobile_no },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Present address not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPresadd');

    const formattedData = formatISTTimestamps(updated);
    res.status(200).json({ message: 'Present address updated successfully for: ', leader_regd_mobile_no });
  } catch (err) {
    console.error('Error updating present address:', err);
    res.status(500).json({ error: 'Internal server error while updating present address' });
  }
};

exports.deletePresaddress = async (req, res) => {
  console.log('deletePresaddress: Request Query Params:', req.query );
  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  leader_regd_mobile_no = leader_regd_mobile_no;

  try {
    const deleted = await LeaderPresentAddress.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Present address not found for mobile ' + regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedPresadd');

    res.status(200).json({ message: 'Present address deleted successfully' });
  } catch (err) {
    console.error('Error deleting present address:', err);
    res.status(500).json({ error: 'Internal server error while deleting present address' });
  }
};

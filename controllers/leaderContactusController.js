const { formatISTTimestamps } = require('../utils/timeFormatter');
const Contactus = require('../models/LeaderContactus');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
exports.fetchContactus = async (req, res) => {
  console.log('fetchContactus: Request Query Params:', req.query );
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const field_to_update = 'updatedContactus';

  if (!leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Mobile number is missing or invalid' });
  }

  try {
    const data = await Contactus.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Contact us data not found for mobile ' + leader_regd_mobile_no });
    }

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    
    const formattedData = formatISTTimestamps(data);
    res.status(200).json({ contactus: formattedData });
  } catch (err) {
    console.error('Error fetching Contact us data:', err);
    res.status(500).json({ error: 'Internal server error while fetching Contact us data' });
  }
};

exports.createContactus = async (req, res) => {
  console.log('fetchContactus: Request Body:', req.body );
  const requestId = req.requestId || 'N/A';
  try {
    let message = '';
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn(`createContactus: req.body is empty`, req.body);
      message = 'Missing request body params';
      console.log(message);
      return res.status(400).json({ error: message });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const payload = req.body.contactus;
    if (!payload || !leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Missing contactus or regd_mobile_no in request body' });
    }
    
    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
      if (!exists) {
        logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
        return res.status(404).json({ error: 'Leader not found in master records' });
      }
    
    const existing = await Contactus.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Contact us data already exists for mobile ' + leader_regd_mobile_no });
    }

    payload.leader_regd_mobile_no = leader_regd_mobile_no;

    console.log('createContactus: Final payload:', payload);

    const data = new Contactus(payload);
    await data.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedContactus');

    const formattedData = formatISTTimestamps(data);
    res.status(201).json({ message: 'Contact us created', Contactus: formattedData });
  } catch (err) {
    if (err.message.includes('leader_regd_mobile_no') && err.message.includes('not found')) {
      return res.status(400).json({ error: 'Invalid leader_regd_mobile_no: no matching Leader Registered Mobile Number found in Leader Coordinates' });
    }
    console.error('Error creating Contactus data:', err);
    res.status(500).json({ error: 'Internal server error while creating Contact us data' });
  }
};

exports.updateContactus = async (req, res) => {
  console.log('fetchContactus: Request Body:', req.body );

  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }
  leader_regd_mobile_no = req.body.leader_regd_mobile_no;
  console.log('updateContactus -> leader_regd_mobile_no: ', leader_regd_mobile_no);

  try {
    const payload = req.body.contactus;
    if (!payload) {
      return res.status(400).json({ error: 'Missing contactus in request body' });
    }

    const updated = await Contactus.findOneAndUpdate(
      { leader_regd_mobile_no: leader_regd_mobile_no },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Contact us data not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedContactus');
    
    const formattedData = formatISTTimestamps(updated);
    res.status(200).json({ message: 'Contact us data updated for : ', leader_regd_mobile_no });
  } catch (err) {
    console.error('Error updating Contact us data:', err);
    res.status(500).json({ error: 'Internal server error while updating Contact us data' });
  }
};

exports.deleteContactus = async (req, res) => {
  console.log('deleteContactus: Request Params:', req.query );
  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  leader_regd_mobile_no = leader_regd_mobile_no;

  try {

    const deleted = await Contactus.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Contact us data not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedContactus');
    
    res.status(200).json({ message: 'Contact us data deleted' });
  } catch (err) {
    console.error('Error deleting Contactus data:', err);
    res.status(500).json({ error: 'Internal server error while deleting Contactus data' });
  }
};

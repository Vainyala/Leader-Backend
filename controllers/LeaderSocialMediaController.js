const { formatISTTimestamps } = require('../utils/timeFormatter');
const LeaderSocialMedia = require('../models/LeaderSocialMedia');
const LeaderCoordinates = require('../models/LeaderCoordinates');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
const logger = require('../utils/logger');

exports.fetchSocialmedia = async (req, res) => {
  console.log('fetchSocialmedia: Request Params:', req.query );
  leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const field_to_update = 'updatedSM';

  try {
    const data = await LeaderSocialMedia.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Social media data not found for mobile ' + leader_regd_mobile_no });
    }

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);

    const formattedData = formatISTTimestamps(data);
    res.status(200).json({ social_media: formattedData });
  } catch (err) {
    console.error('Error fetching social media data:', err);
    res.status(500).json({ error: 'Internal server error while fetching social media data' });
  }
};

exports.createSocialmedia = async (req, res) => {
  console.log('createSocialMedia: Request Body:', req.body );
  
  let message = '';
  const requestId = req.requestId || 'N/A';
  
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
      console.warn(`createSocialMedia: req.body is empty`, req.body);
      message = 'Missing request body params';
      console.log(message);
      return res.status(400).json({ error: message });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const payload = req.body.social_media;
    if (!payload || !leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Missing social_media or leader_regd_mobile_no in request body' });
    }

    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!exists) {
      logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const existing = await LeaderSocialMedia.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Social media data already exists for mobile ' + leader_regd_mobile_no });
    }

    payload.leader_regd_mobile_no = leader_regd_mobile_no;
    console.log('createSocialMedia: Final payload:', payload);

    const data = new LeaderSocialMedia(payload);
    await data.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');

    const formattedData = formatISTTimestamps(data);        
    res.status(201).json({ message: 'Social media data created', social_media: formattedData });
  } catch (err) {
    if (err.message.includes('leader_regd_mobile_no') && err.message.includes('not found')) {
      return res.status(400).json({ error: 'Invalid leader_regd_mobile_no: no matching Leader Registered Mobile Number found in Leader Coordinates' });
    }
    console.error('Error creating social media data:', err);
    res.status(500).json({ error: 'Internal server error while creating social media data' });
  }
};



// Implemented to track the update status -- 06/01/2026
exports.updateSocialmedia = async (req, res) => {
  console.log('updateSocialmedia API: Request Body:', req.body );
  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }
  const leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  try {
    const payload = req.body.social_media;
    if (!payload) {
      return res.status(400).json({ error: 'Missing social_media in request body' });
    }
   
    const updated = await LeaderSocialMedia.findOneAndUpdate(
      { leader_regd_mobile_no: leader_regd_mobile_no },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Social media data not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');
 
    const formattedData = formatISTTimestamps(updated);
    res.status(200).json({ message: 'Social media data updated', social_media: formattedData });
  } catch (err) {
    console.error('Error updating social media data:', err);
    res.status(500).json({ error: 'Internal server error while updating social media data' });
  }
};

exports.deleteSocialmedia = async (req, res) => {
  console.log('deleteSocialMedia: Request Query:', req.query );
  if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;

  try {

    const deleted = await LeaderSocialMedia.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Social media data not found for mobile ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');

    res.status(200).json({ message: 'Social media data deleted' });
  } catch (err) {
    console.error('Error deleting social media data:', err);
    res.status(500).json({ error: 'Internal server error while deleting social media data' });
  }
};

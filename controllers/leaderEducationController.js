const { formatISTTimestamps } = require('../utils/timeFormatter');
const LeaderEducation = require('../models/LeaderEducation');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
//const validateUserType = require('../utils/validateUserType');

exports.fetchEducation = async (req, res) => {
    console.log('fetchEducation: Request Query:', req.query );
    leader_regd_mobile_no = req.query.leader_regd_mobile_no;
    const field_to_update = 'updatedEducation';

  try {
    const data = await LeaderEducation.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!data) {
      return res.status(404).json({ error: 'Education data not found for mobile ' + leader_regd_mobile_no });
    }

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);

    const formattedData = formatISTTimestamps(data);
    res.status(200).json({ leader_edu_data: formattedData });
  } catch (err) {
    console.error('Error fetching education data:', err);
    res.status(500).json({ error: 'Internal server error while fetching education data' });
  }
};

exports.createEducation = async (req, res) => {
  const requestId = req.requestId || 'N/A';
  try {
    const { user_type } = req;
    console.log('createEducation: User_type received: ', user_type, ' Request Body:', req.body);

    if (user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const edu_qual = req.body.edu_qual;

    console.log('createEducation: edu_qual1:', edu_qual);

    if (!Array.isArray(edu_qual) || edu_qual.length === 0) {
      return res.status(400).json({ error: 'Please input at least one educational qualification, Try again.' });
    }

    if (!edu_qual || !leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Missing edu_qual or leader_regd_mobile_no in request body' });
    }

    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no });
    if (!exists) {
      logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const existing = await LeaderEducation.findOne({ leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Education data already exists for mobile ' + leader_regd_mobile_no });
    }

    // Refactored payload to match schema
    const payload = {
      leader_regd_mobile_no,
      edu_qual
    };

    console.log('createEducation: edu_qual2:', payload);

    const data = new LeaderEducation(payload);
    await data.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');
    
    const formattedData = formatISTTimestamps(data);
    res.status(201).json({ message: 'Education data created', leader_edu_data: formattedData });
  } catch (err) {
    if (err.message.includes('leader_regd_mobile_no') && err.message.includes('not found')) {
      return res.status(400).json({ error: 'Invalid leader_regd_mobile_no: no matching Leader Registered Mobile Number found in Leader Coordinates' });
    }
    console.error('Error creating education data:', err);
    res.status(500).json({ error: 'Internal server error while creating education data' });
  }
};


exports.updateEducation = async (req, res) => {
  
  const { user_type } = req;
  console.log('updateEducation: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  console.log('updateEducation: Request Body:', req.body );
  
  try {
    const payload = req.body.leader_edu_data;
    if (!payload) {
      return res.status(400).json({ error: 'Missing leader_edu_data in request body' });
    }

    const updated = await LeaderEducation.findOneAndUpdate(
      { regd_mobile_no: req.params.mobile },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Education data not found for mobile ' + req.params.mobile });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');
    
    const formattedData = formatISTTimestamps(updated);
    //res.status(200).json({ message: 'Education data updated', leader_edu_data: formattedData });
    res.status(200).json({ message: 'Education data updated successfully' });
  } catch (err) {
    console.error('Error updating education data:', err);
    res.status(500).json({ error: 'Internal server error while updating education data' });
  }
};

exports.deleteEducation = async (req, res) => {

  const { user_type } = req;
  console.log('deleteEducation: User_type received: ', user_type, ' Request Query:', req.query);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
  
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no; // ✅ Extract mobile from route params
  console.log('deleteEducation: Request Query:', req.query );
  try {
    // Reject if mobile is not a valid number
    if (!/^\d{10}$/.test(leader_regd_mobile_no)) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    const deleted = await LeaderEducation.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Education data not found for mobile: ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');
    
    res.status(200).json({ message: 'Education data deleted successfully' });
  } catch (err) {
    console.error('Error deleting education data:', err);
    res.status(500).json({ error: 'Internal server error while deleting education data' });
  }
};


// To add additional education into the  existing data like add 2nd/3rd ... education entries.
// Note: 1st entry must be created using createEducation method

exports.addEducationEntry = async (req, res) => {

  const { user_type } = req;
  console.log('addEducationEntry: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
  const { leader_regd_mobile_no } = req.body;
  const newEntry = req.body.edu_qual;

  try {
    const doc = await LeaderEducation.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!doc) return res.status(404).json({ error: 'Education record not found' });

    // Optional: Prevent duplicate entries
    const isDuplicate = doc.edu_qual.some(entry =>
      entry.degree === newEntry.degree &&
      entry.college === newEntry.college &&
      entry.university === newEntry.university &&
      entry.place === newEntry.place
    );

    if (isDuplicate) {
      return res.status(409).json({ error: 'Duplicate education entry' });
    }

    doc.edu_qual.push(newEntry);
    await doc.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');
    
    const formattedData = formatISTTimestamps(doc);
    //res.status(201).json({ message: 'Education entry added', leader_edu_data: formattedData });
    res.status(201).json({ message: 'Education entry added successfully'});
  } catch (err) {
    console.error('Error adding education entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Education Entry by _id of a particular education entry
exports.updateEducationById = async (req, res) => {

  const { user_type } = req;
  console.log('updateEducation: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  console.log('updateEducationById: Request Params: ', req.params, '  Request Body:', req.body );
  const { leader_regd_mobile_no, eduId } = req.body;
  const updatedFields = req.body.edu_qual;

  try {
    const doc = await LeaderEducation.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!doc) return res.status(404).json({ error: 'Education record not found' });

    const entry = doc.edu_qual.id(eduId);
    if (!entry) return res.status(404).json({ error: 'Education entry not found' });

    Object.assign(entry, updatedFields);
    await doc.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');
    
    const formattedData = formatISTTimestamps(doc);
    //res.status(200).json({ message: 'Education entry updated successfully', leader_edu_data: formattedData });
    res.status(200).json({ message: 'Education entry updated successfully'});
  } catch (err) {
    console.error('Error updating education entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete Education Entry by _id of a particular education entry
  exports.deleteEducationById = async (req, res) => {

  const { user_type } = req;
  console.log('deleteEducation: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  console.log('deleteEducationById: Request Query:', req.query );
  const { leader_regd_mobile_no, eduId } = req.query;

  try {
    // Reject if mobile is not a valid number
    if (!/^\d{10}$/.test(leader_regd_mobile_no)) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    const doc = await LeaderEducation.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!doc) return res.status(404).json({ error: 'Education record not found' });

    const entry = doc.edu_qual.id(eduId);
    if (!entry) return res.status(404).json({ error: 'Education entry not found' });

     // Remove using pull
    doc.edu_qual.pull({ _id: eduId });
    await doc.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedEducation');

    //res.status(200).json({ message: 'Education entry deleted successfully', leader_edu_data: doc });
    res.status(200).json({ message: 'Education entry deleted successfully'});
  } catch (err) {
    console.error('Error deleting education entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/*
// 🗑️ Delete education entry by ID
exports.deleteEducationById = async (req, res) => {
  const { mobile, eduId } = req.body;
  console.log('deleteEducationById: Request Body:', req.body );
  try {
    const deletedEntry = await Education.findOneAndDelete({ _id: eduId, mobile });

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    res.status(200).json({ message: 'Education entry deleted', data: deletedEntry });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete education entry' });
  }
};
*/
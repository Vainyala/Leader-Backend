//leaderTimelineController.js

const LeaderTimeline = require('../models/LeaderTimeline');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const { formatISTTimestamps } = require('../utils/timeFormatter');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
//const validateUserType = require('../utils/validateUserType');

// Create a new timeline entry
exports.createTimelineEntry = async (req, res, next) => {
  const requestId = req.requestId || 'N/A';
  const field_to_update = 'updatedTimeline';

  logger.info(`[${requestId}] createTimelineEntry: Request Body: ${JSON.stringify(req.body)}`);

  const { leader_regd_mobile_no, timeline } = req.body || {};

  if (!leader_regd_mobile_no || !Array.isArray(timeline)) {
    logger.warn(`[${requestId}] Invalid request format`);
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    const { user_type } = req;
    console.log('createTimelineEntry: User_type received: ', user_type, ' Request Body:', req.body);
    
    if (user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
    }
    const masterExists = await LeaderCoordinates.findOne({ leader_regd_mobile_no });
    if (!masterExists) {
      logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    let leader = await LeaderTimeline.findOne({ leader_regd_mobile_no });
    if (!leader) {
      leader = new LeaderTimeline({ leader_regd_mobile_no, timeline: [] });
    }

    // Push each entry with server-side timestamp
    timeline.forEach(entry => {
      leader.timeline.push({ ...entry, timestamp: new Date() });
    });

    await leader.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedTimeline');

    logger.info(`[${requestId}] Created ${timeline.length} timeline entries for ${leader_regd_mobile_no}`);
    res.status(201).json({ message: 'Timeline entries created', data: timeline });
  } catch (err) {
    logger.error(`[${requestId}] Timeline creation error for ${leader_regd_mobile_no}: ${err.message}`);
    next(err);
  }
};

// Get timeline entries
exports.getTimeline = async (req, res, next) => {
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId || 'N/A';
  const field_to_update = 'updatedTimeline';

  try {
    const masterExists = await LeaderCoordinates.findOne({ leader_regd_mobile_no });
    if (!masterExists) {
      logger.warn(`[${requestId}] Timeline fetch failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const leader = await LeaderTimeline.findOne({ leader_regd_mobile_no });
    if (!leader) {
      logger.info(`[${requestId}] No timeline found for ${leader_regd_mobile_no}`);
      return res.status(200).json({ leader_regd_mobile_no, timeline: [] });
    }

    const sortedTimeline = leader.timeline.sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateB - dateA;
    });

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    
    logger.info(`[${requestId}] Fetched ${sortedTimeline.length} timeline entries for ${leader_regd_mobile_no}`);
    res.status(200).json({ leader_regd_mobile_no, timeline: sortedTimeline });
  } catch (err) {
    logger.error(`[${requestId}] Timeline fetch error for ${leader_regd_mobile_no}: ${err.message}`);
    next(err);
  }
};

// Update timeline entries

exports.updateTimelineEntries = async (req, res) => {

  const { user_type } = req;
  console.log('updateTimelineEntries: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  console.log('updateTimelineEntries: Request Params: ', req.params, '  Request Body:', req.body );
  const { leader_regd_mobile_no, timelineId } = req.body;
  const updatedFields = req.body.timeline;

  try {
    const doc = await LeaderTimeline.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!doc) return res.status(404).json({ error: 'Timeline record not found' });

    const entry = doc.timeline.id(timelineId);
    if (!entry) return res.status(404).json({ error: 'Timeline entry not found' });

    Object.assign(entry, updatedFields);
    await doc.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedTimeline');
    
    const formattedData = formatISTTimestamps(doc);
    //res.status(200).json({ message: 'Timeline entry updated successfully', leader_edu_data: formattedData });
    res.status(200).json({ message: 'Timeline entry updated successfully'});
  } catch (err) {
    console.error('Error updating education entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
/*
exports.updateTimelineEntries = async (req, res, next) => {
  const { regd_mobile_no } = req.params;
  const updates = req.body.timeline;
  const requestId = req.requestId;

  const { user_type } = req;
  console.log('updateTimelineEntry: User_type received: ', user_type, ' Request Body:', req.body);
    
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
  try {
    const masterExists = await LeaderCoordinates.findOne({ regd_mobile_no });
    if (!masterExists) {
      logger.warn(`[${requestId}] Update failed: No master found for ${regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const leader = await LeaderTimeline.findOne({ regd_mobile_no });
    if (!leader) {
      logger.warn(`[${requestId}] Update failed: No timeline found for ${regd_mobile_no}`);
      return res.status(404).json({ error: 'Timeline not found' });
    }

    let updatedCount = 0;
    updates.forEach(update => {
      const entry = leader.timeline.find(e => new Date(e.timestamp).getTime() === new Date(update.timestamp).getTime());
      if (entry) {
        Object.assign(entry, update);
        updatedCount++;
      }
    });

    await leader.save();
    logger.info(`[${requestId}] Updated ${updatedCount} timeline entries for ${regd_mobile_no}`);
    res.status(200).json({ message: 'Timeline entries updated', data: leader });
  } catch (err) {
    logger.error(`[${requestId}] Timeline update error for ${regd_mobile_no}: ${err.message}`);
    next(err);
  }
};
*/


// Delete timeline - All entries
exports.deleteTimelineEntries = async (req, res, next) => {

  const { user_type } = req;
  console.log('deleteTimelineEntries: User_type received: ', user_type, ' Request Query:', req.query);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no; // Extract mobile from route params
  //console.log('deleteTimelineEntries: Request Query:', req.query );
  try {
    // Reject if mobile is not a valid number
    if (!/^\d{10}$/.test(leader_regd_mobile_no)) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }
/*
    const masterExists = await LeaderCoordinates.findOne({ leader_regd_mobile_no });
    if (!masterExists) {
      console.log('deleteTimelineEntries: Delete failed: No master found for :', leader_regd_mobile_no);
      //logger.warn(`[${requestId}] Delete failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }
*/
    console.log ('Am here.........................');

    const deleted = await LeaderTimeline.findOneAndDelete({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!deleted) {
      return res.status(404).json({ error: 'Timeline data not found for mobile: ' + leader_regd_mobile_no });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedTimeline');

    console.error('Timeline data deleted successfully');
    res.status(200).json({ message: 'Timeline data deleted' });
  } catch (err) {
    console.error('Error deleting Timeline data:', err);
    res.status(500).json({ error: 'Internal server error while deleting education data' });
  }
};

/*

const regd_mobile_no = req.query.leader_regd_mobile_no;
  const toDelete = req.body.timeline;
  const requestId = req.requestId;
  const { user_type } = req;

  console.log('deleteTimelineEntry: User_type received: ', user_type, ' Request Query:', req.query);
    
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }

  try {
    const masterExists = await LeaderCoordinates.findOne({ regd_mobile_no });
    if (!masterExists) {
      logger.warn(`[${requestId}] Delete failed: No master found for ${regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const leader = await LeaderTimeline.findOne({ regd_mobile_no });
    if (!leader) {
      logger.warn(`[${requestId}] Delete failed: No timeline found for ${regd_mobile_no}`);
      return res.status(404).json({ error: 'Timeline not found' });
    }

    const initialCount = leader.timeline.length;
    leader.timeline = leader.timeline.filter(entry => {
      return !toDelete.some(del =>
        new Date(del.timestamp).getTime() === new Date(entry.timestamp).getTime()
      );
    });

    const deletedCount = initialCount - leader.timeline.length;
    await leader.save();
    logger.info(`[${requestId}] Deleted ${deletedCount} timeline entries for ${regd_mobile_no}`);
    res.status(200).json({ message: 'Timeline entries deleted', data: leader });
  } catch (err) {
    logger.error(`[${requestId}] Timeline delete error for ${regd_mobile_no}: ${err.message}`);
    next(err);
  }
};
*/

// Delete Timeline Entry by _id of a particular Timeline entry
  exports.deleteTimelineById = async (req, res) => {

  const { user_type } = req;
  console.log('deleteTimelineById: User_type received: ', user_type, ' Request Body:', req.body);
  
  if (user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Oops! Action forbidden' });
  }
 
  console.log('deleteTimelineById: Request Query:', req.query );
  const { leader_regd_mobile_no, timelineId } = req.query;

  try {
    // Reject if mobile is not a valid number
    if (!/^\d{10}$/.test(leader_regd_mobile_no)) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    const doc = await LeaderTimeline.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!doc) return res.status(404).json({ error: 'Timeline record not found' });

    const entry = doc.timeline.id(timelineId);
    if (!entry) return res.status(404).json({ error: 'Timeline entry not found' });

     // Remove using pull
    doc.timeline.pull({ _id: timelineId });
    await doc.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedTimeline');
    
    res.status(200).json({ message: 'Timeline Entry by Id deleted'});
  } catch (err) {
    console.error('Error deleting Timeline entry by Id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


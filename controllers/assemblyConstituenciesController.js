const AssemblyConstituencies = require('../models/AssemblyConstituencies');
const LeaderCoordinates = require('../models/LeaderCoordinates');
const logger = require('../utils/logger');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
exports.createAssemblyData = async (req, res, next) => {

  let message = '';
  if (!req.body || Object.keys(req.body).length === 0) {
    console.warn(`createPresaddress: req.body is empty`, req.body);
    message = 'Missing request body params';
    console.log(message);
    return res.status(400).json({ error: message });
  }

   if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }

  const requestId = req.requestId || 'N/A';
  const data = req.body.assembly_constituencies;
  const leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  try {
    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!exists) {
      logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    data.leader_regd_mobile_no = leader_regd_mobile_no;

    console.log('createAssemblyConstituencyData: Final payload:', data);

    const record = new AssemblyConstituencies(data);
    await record.save();

    logger.info(`[${requestId}] Assembly data created for ${leader_regd_mobile_no}`);

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedAC');
        
    res.status(201).json({ message: 'Assembly data created', data: record });
  } catch (err) {
    logger.error(`[${requestId}] Assembly creation error: ${err.message}`);
    next(err);
  }
};

exports.getAssemblyData = async (req, res, next) => {
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId || 'N/A' ;
  let field_to_update = 'updatedAC';

  try {
    const record = await AssemblyConstituencies.findOne({ leader_regd_mobile_no });
    if (!record) {
      logger.warn(`[${requestId}] No assembly data found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Assembly data not found' });
    }

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);

    logger.info(`[${requestId}] Fetched assembly data for ${leader_regd_mobile_no}`);
    res.status(200).json(record);
  } catch (err) {
    logger.error(`[${requestId}] Assembly fetch error: ${err.message}`);
    next(err);
  }
};

exports.updateAssemblyData = async (req, res, next) => {
   if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }
  const leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  const updates = req.body.assembly_constituencies;
  const requestId = req.requestId || 'N/A';

  try {

    const record = await AssemblyConstituencies.findOneAndUpdate({ leader_regd_mobile_no }, updates, { new: true });
    if (!record) {
      logger.warn(`[${requestId}] Update failed: No assembly data for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Assembly data not found' });
    }

    logger.info(`[${requestId}] Updated assembly data for ${leader_regd_mobile_no}`);

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedAC');

    res.status(200).json(record);
  } catch (err) {
    logger.error(`[${requestId}] Assembly update error: ${err.message}`);
    next(err);
  }
};

exports.deleteAssemblyData = async (req, res, next) => {
  const requestId = req.requestId || 'N/A';
  try {
    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const leader_regd_mobile_no = req.query.leader_regd_mobile_no;

    const deleted = await AssemblyConstituencies.findOneAndDelete({ leader_regd_mobile_no });
    if (!deleted) {
      logger.warn(`[${requestId}] Delete failed: No assembly data for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Assembly data not found' });
    }

    logger.info(`[${requestId}] Deleted assembly data for ${leader_regd_mobile_no}`);

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedAC');

    res.status(200).json({ message: 'Assembly data deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Assembly delete error: ${err.message}`);
    next(err);
  }
};

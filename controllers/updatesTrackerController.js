// updatesTrackerController.js

const BootstrapLog = require('../models/BootstrapLog');
const UpdatesTrackerModel = require('../models/UpdatesTrackerModel');

// GET /updates/
exports.getDevicedatarefreshStatus = async (req, res) => {
  
  try {
    const client_regd_mobile_no = req.client_regd_mobile_no;
    const device_aaid = req.device_aaid;
    const device_fingerprint = req.device_fingerprint
    console.log('updatesTrackerController: getDevicedatarefreshStatus: client_regd_mobile_no: ', client_regd_mobile_no, ' device_aaid: ', device_aaid, ' : device_fingerprint: ', device_fingerprint);
  
    const result = await BootstrapLog.findOne(
      { client_regd_mobile_no: client_regd_mobile_no, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
    );
    if (!result) {
      return res.status(404).json({ error: 'Oops! Your Device is not registered, Reinstall the App and launch again.' });
    }
    return res.json({device_data_refresh: result.device_data_refresh});
  } catch (err) {
    console.error('[getDevicedatarefreshStatus] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// GET /updates/status
exports.getAllUpdatesStatus = async (req, res) => {
  try {
    console.log('updatesTrackerController: getAllUpdatesStatus called.....');

    const client_regd_mobile_no = req.client_regd_mobile_no;
    const device_aaid = req.device_aaid;
    const device_fingerprint = req.device_fingerprint
    console.log('updatesTrackerController: getAllUpdateStatus: client_regd_mobile_no: ', client_regd_mobile_no, ' device_aaid: ', device_aaid, ' : device_fingerprint: ', device_fingerprint);
  
    const tracker = await UpdatesTrackerModel.findOne(
      { client_regd_mobile_no: client_regd_mobile_no, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
    );
    if (!tracker) {
      return res.status(404).json({ error: 'Oops! Your Device is not registered, Reinstall the App and launch again.' });
    }
    res.json(tracker);
  } catch (err) {
    console.error('[getAllUpdatesStatus] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /updates/status/:field
exports.getUpdateStatusByField = async (req, res) => {
  const { field } = req.params;

  const client_regd_mobile_no = req.client_regd_mobile_no;
  const device_aaid = req.device_aaid;
  const device_fingerprint = req.device_fingerprint
  console.log('updatesTrackerController: getUpdateStatusByField: device_aaid: ', device_aaid, ' : device_fingerprint: ', device_fingerprint);
  console.log('updatesTrackerController: getUpdateStatusByField: fieldname: ', field);
    
  try {
    const validFields = [
      'updatedAC','updatedCP','updatedContactus','updatedCoordinates',
      'updatedEducation','updatedPermadd','updatedPresadd','updatedPersdet',
      'updatedSM','updatedTimeline'
    ];

    if (!validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field name' });
    }

    const tracker = await UpdatesTrackerModel.findOne(
      { client_regd_mobile_no: client_regd_mobile_no, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
    );
    if (!tracker) {
       return res.status(404).json({ error: 'Oops! Your Device is not registered, Reinstall the App and launch again.' });
    }

    res.json({ [field]: tracker[field] });
  } catch (err) {
    console.error('[getUpdateStatusByField] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

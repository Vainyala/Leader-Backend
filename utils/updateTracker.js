// utils/updateTracker.js
const BootstrapLog = require('../models/BootstrapLog');
const UpdatesTrackerModel = require('../models/UpdatesTrackerModel');

/**
 * Valid fields allowed for tracker updates
 */
const validFields = [
  'updatedAC','updatedCP','updatedCPImage','updatedCPMap', 'updatedContactus','updatedCoordinates','updatedLeaderImage',
  'updatedEducation','updatedPermadd','updatedPresadd','updatedPersdet',
  'updatedSM','updatedTimeline'
];

/**
 * Update a specific field in UpdatesTrackerModel
 * Also triggers bulk update of device_data_refresh in BootstrapLog
 * @param {String} field - The field name
 * @param {Boolean} value - The value to set (default true)
 * @returns {Promise<Object>} - The updated tracker document
 */
async function updateTrackerFieldTrue(leader_regd_mobile_no, field) {
  console.log('[updateTracker] updateTrackerFieldTrue: ', leader_regd_mobile_no, ' called for field:', field);

  try {
    if (!validFields.includes(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }

    //await markDeviceDataRefreshTrue(leader_regd_mobile_no);

    const result = await UpdatesTrackerModel.updateMany(
      //{ _id: { $exists: true } },
      { client_regd_mobile_no:leader_regd_mobile_no },
      { $set: { [field]: true } },
      { upsert: false }
    );

    console.log('UpdateTrackerModel query result: ', result);

    if (result.matchedCount) { 
        console.log(
            `[updateTracker: UpdateTrackerModel]: matchedCount: ${result.matchedCount} : `+
            ` Update Flag "${field}" set to TRUE for ${result.modifiedCount} documents ` 
        );
    } else { 
        console.warn('[updateTracker: updateTrackerModel]: No documents found to update'); 
    }
    return;

  } catch (err) {
    console.error('[updateTracker] Error updating UpdateTrackerModel collection', err);
    throw err;
  }
}


/**
 * Update a specific field in UpdatesTrackerModel for a given device (aaid & fingerprint)
 * in BootstrapLog and UpdateTrackerModel Collections
 * 
 * @param {String} field - The field name
 * @param {Boolean} value - The value to set (default true)
 * @returns {Promise<Object>} - The updated tracker document
 */
async function updateTrackerFieldFalse(leader_regd_mobile_no, deviceAaid, deviceFingerprint, field) {
  console.log(
    '/utils/updateTracker: updateTrackerFieldFalse:',
    'AAID:', deviceAaid,
    'Fingerprint:', deviceFingerprint,
    'Field:', field
  );

  try {
    if (!validFields.includes(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }

    // Set device_data_refresh = false only for this device in BootstrapLog
    //await markDeviceDataRefreshFalse(leader_regd_mobile_no, deviceAaid, deviceFingerprint);

    // Update the dynamic field to false in UpdatesTrackerModel for this device
    const result = await UpdatesTrackerModel.updateMany(
      { client_regd_mobile_no:leader_regd_mobile_no, device_aaid: deviceAaid, device_fingerprint: deviceFingerprint },  // filter
      { $set: { [field]: false } },                                        // update with computed key
      { upsert: false }                                                    // options
    );

    console.log('UpdatesTrackerModel query result: ', result);

    if (result.matchedCount) { 
        console.log(
            `[updateTracker: UpdateTrackerModel]: matchedCount: ${result.matchedCount} : `+
            ` Update Flag "${field}" set to FALSE for ${result.modifiedCount} documents `
        );
    } else { 
        console.warn('[updateTracker: updateTrackerModel]: No documents found to update'); 
    }
    return;

  } catch (err) {
    console.error('[updateTracker] Error updating UpdateTrackerModel collection', err);
    throw err;
  }
}



/**
 * Bulk update: set device_data_refresh = true for all existing BootstrapLog documents
 * 
 * Manual testing in MongoDB Shell
 * db.bootstraplogs.updateMany(
  {},
  { $set: { device_data_refresh: true } },
  { upsert: false }
);

 */
async function markDeviceDataRefreshTrue(leader_regd_mobile_no) {
  try {
    const result = await BootstrapLog.updateMany(
      { _id: { $exists: true } }, // only existing docs
      { client_regd_mobile_no:leader_regd_mobile_no },
      { $set: { device_data_refresh: true } },
      { upsert: false }
    );

    console.log('BootstrapLog query result: ', result);

    if (result.matchedCount) { 
        console.log(
            `[updateTracker]: matchedCount: ${result.matchedCount} : device_data_refresh `+
            `set to TRUE for ${result.modifiedCount} documents in BootStrapLog Collection.)`
        );
    } else { 
        console.warn('[updateTracker]: No documents found in BootStrapLog Collection to update'); 
    }
    return;
} catch (err) {
    console.error('updateDeviceRefreshDataBulk: Error updating BootstrapLog collection', err);
    throw err;
  }
}

/**
 * Update device_data_refresh = false for a specific device
 * matched by device_aaid and device_fingerprint.
 *
 * @param {String} deviceAaid - The device advertising ID
 * @param {String} deviceFingerprint - The device fingerprint
 * @returns {Promise<Object>} - The MongoDB update result
 */
async function markDeviceDataRefreshFalse(leader_regd_mobile_no, deviceAaid, deviceFingerprint) {
  try {

    console.log(' updateDeviceRefresh: Device AAID:', deviceAaid);
    console.log(' Device Fingerprint:', deviceFingerprint);

    const result = await BootstrapLog.updateMany(
      { client_regd_mobile_no:leader_regd_mobile_no, device_aaid: deviceAaid, device_fingerprint: deviceFingerprint },
      { $set: { device_data_refresh: false } },
      { upsert: false }
    );

    console.log('BootstrapLog query result: ', result);

    if (result.matchedCount) { 
        console.log(
            `[updateTracker]: matchedCount: ${result.matchedCount} : device_data_refresh `+
            `set to FALSE for ${result.modifiedCount} documents in BootStrapLog Collection.)`
        );
    } else { 
        console.warn('[updateTracker]: No documents found in BootStrapLog Collection to update'); 
    }
    return;

  } catch (err) {
    console.error('markDeviceDataRefreshFalse: Error updating BootstrapLog collection', err);
    throw err;
  }
}


module.exports = { updateTrackerFieldTrue, updateTrackerFieldFalse };

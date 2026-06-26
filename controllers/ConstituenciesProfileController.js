const LeaderCoordinates = require('../models/LeaderCoordinates');

const fs = require('fs');
const path = require('path');
const ConstituencyProfile = require('../models/ConstituencyProfile');
const logger = require('../utils/logger');
const { logFileChange } = require('../utils/auditLogger');
const { deleteFile } = require('../utils/fileUtils'); // adjust path as needed

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026

// Upload or update constituency map
exports.uploadOrUpdateMap = async (req, res, next) => {
  const { leader_regd_mobile_no } = req.params;
  const newMapPath = req.body.constituency_map;
  const requestId = req.requestId;
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile) {
      logger.warn(`[${requestId}] Map update failed: No profile for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.constituency_map) {
      deleteFile(profile.constituency_map);
      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.constituency_map, field: 'constituency_map', requestId, userId });
    }

    profile.constituency_map = newMapPath;
    await profile.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPMap');
    
    await logFileChange({ leader_regd_mobile_no, action: 'Uploaded', filename: newMapPath, field: 'constituency_map', requestId, userId });
    logger.info(`[${requestId}] Map updated for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Map updated', filename: newMapPath });
  } catch (err) {
    logger.error(`[${requestId}] Map update error: ${err.message}`);
    next(err);
  }
};

// 🆕 Upload or update member image
exports.uploadOrUpdateMemberImage = async (req, res, next) => {

 if (!req.file) {
    logger.warn(`[${requestId}] No file uploaded under expected field 'member_image'`);
    return res.status(400).json({ error: "Missing 'member_image' file in form-data" });
    }   
   
  const { leader_regd_mobile_no } = req.params;
  const newImagePath = req.body.member_image;
  const requestId = req.requestId;
  const userId = req.headers['x-user-id'] || 'anonymous';
 
  console.log('uploadOrUpdateMemberImage: Request Body: ', req.body);
  
  try {

    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile) {
      logger.warn(`[${requestId}] Member image update failed: No profile for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.member_image) {
      deleteFile(profile.member_image);
      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.member_image, field: 'member_image', requestId, userId });
    }

    profile.member_image = newImagePath;
    await profile.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPImage');

    await logFileChange({ leader_regd_mobile_no, action: 'Uploaded', filename: newImagePath, field: 'member_image', requestId, userId });
    logger.info(`[${requestId}] Member image updated for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Image updated', filename: newImagePath });
  } catch (err) {
    logger.error(`[${requestId}] Member image update error: ${err.message}`);
    next(err);
  }
};

//  Delete constituency map
exports.deleteMap = async (req, res, next) => {
  const { leader_regd_mobile_no } = req.params;
  const requestId = req.requestId;
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile || !profile.constituency_map) {
      logger.warn(`[${requestId}] Map delete failed: No map for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Map not found' });
    }

    deleteFile(profile.constituency_map);
    await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.constituency_map, field: 'constituency_map', requestId, userId });

    profile.constituency_map = null;
    await profile.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPMap');

    logger.info(`[${requestId}] Map deleted for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Map deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Map delete error: ${err.message}`);
    next(err);
  }
};



exports.createProfile = async (req, res, next) => {
  const requestId = req.requestId;
  try {
    console.log('createConstituencyProfile: Request Body:', req.body );
    let message = '';
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
    const data = req.body.constitency_profile;

    if (!data || !leader_regd_mobile_no) {
      return res.status(400).json({ error: 'Missing Constituency Profile Body Params or leader_regd_mobile_no in request body' });
    }

    data.leader_regd_mobile_no = leader_regd_mobile_no;

    console.log('createConstituencyProfile: data payload:', data);
    
    const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (!exists) {
      logger.warn(`[${requestId}] Create failed: No master found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Leader not found in master records' });
    }

    const existing = await ConstituencyProfile.findOne({ leader_regd_mobile_no: leader_regd_mobile_no });
    if (existing) {
      return res.status(409).json({ error: 'Constitunecy Profile already exists for mobile ' + leader_regd_mobile_no });
    }

    const profile = new ConstituencyProfile(data);
    await profile.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCP');

    logger.info(`[${requestId}] Constituency profile created for ${leader_regd_mobile_no}`);
    res.status(201).json({ message: 'Profile created', data: profile });
  } catch (err) {
    logger.error(`[${requestId}] Profile creation error: ${err.message}`);
    next(err);
  }
};


// Updated code on 24 Oct 2025
exports.getProfile = async (req, res, next) => {
  //const { leader_regd_mobile_no: regd_mobile_no } = req.query;
  const requestId = req.requestId;
  let field_to_update = 'updatedCP';

  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const hostUrl = `${process.env.HOST_URL}:${process.env.PORT}`;

  logger.info(`[${requestId}] getProfile invoked with leader_regd_mobile_no: ${leader_regd_mobile_no}`);
  logger.debug(`[${requestId}] Host URL resolved as: ${hostUrl}`);
  logger.info(`[${requestId}] Host URL resolved as: ${hostUrl}`);
  
  if (!leader_regd_mobile_no) {
    logger.warn(`[${requestId}] Missing leader_regd_mobile_no in query params`);
    return res.status(400).json({ error: 'Missing required parameter: leader_regd_mobile_no' });
  }

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });

    if (!profile) {
      logger.warn(`[${requestId}] No profile found for mobile number: ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Constituency Profile Data not found' });
    }

    const { member_image, constituency_map, _id: recordId } = profile;

    if (member_image) {
      profile.member_image = `${hostUrl}/constituency/${member_image}`;
      logger.debug(`[${requestId}] Member image URL constructed: ${profile.member_image}`);
      logger.info(`[${requestId}] Member image URL constructed: ${profile.member_image}`);
    } else {
      logger.warn(`[${requestId}] No member image found for record ID: ${recordId}`);
    }

    if (constituency_map) {
      profile.constituency_map = `${hostUrl}/constituency/${constituency_map}`;
      logger.debug(`[${requestId}] Constituency Map URL constructed: ${profile.constituency_map}`);
      logger.info(`[${requestId}] constituency Map URL constructed: ${profile.constituency_map}`);
    } else {
      logger.warn(`[${requestId}] No constituency Map found for record ID: ${recordId}`);
    }

    logger.info(`[${requestId}] Successfully fetched profile for ${leader_regd_mobile_no}`);

    // Update tracker flag: updatedCP = false for the given device
    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
    // Update tracker flag: updatedCPImage = false for the given device
    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, 'updatedCPImage');
    // Update tracker flag: updatedCPMap = false for the given device
    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, 'updatedCPMap');

    return res.status(200).json(profile);
  } catch (error) {
    logger.error(`[${requestId}] Error fetching profile: ${error.message}`, { stack: error.stack });
    return next(error);
  }
};


exports.updateProfile = async (req, res, next) => {
  
  console.log('updateConstituncyProfile: Req.Body: ', req.body);

   if (req.user_type === 'user') {
    return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
  }
  const leader_regd_mobile_no = req.body.leader_regd_mobile_no;

  const updates = req.body.constitency_profile;
  const requestId = req.requestId;
  /*
  if (!updates.member_image) {
    updates.member_image = null;
    console.log('Member Image is null: ', updates.member_image);
  }
  */
  try {
 
    const profile = await ConstituencyProfile.findOneAndUpdate({ leader_regd_mobile_no: leader_regd_mobile_no }, 
      updates, 
      { new: true });
    if (!profile) {
      logger.warn(`[${requestId}] Update failed: No profile found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCP');


    logger.info(`[${requestId}] Updated profile for ${leader_regd_mobile_no}`);
    res.status(200).json('Constituency Profile updated successfully ' );
  } catch (err) {
    logger.error(`[${requestId}] Profile update error: ${err.message}`);
    next(err);
  }
};


exports.deleteProfile = async (req, res, next) => {

  console.log('deleteConstituencyProfile: req.query: ', req.query);
  const requestId = req.requestId;
try {
  
    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile) {
      logger.warn(`[${requestId}] Delete failed: No profile for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Clean up files
    if (profile.member_image) deleteFile(profile.member_image);
    if (profile.constituency_map) deleteFile(profile.constituency_map);

    await ConstituencyProfile.deleteOne({ leader_regd_mobile_no });

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCP');


    logger.info(`[${requestId}] Deleted profile and associated files for ${leader_regd_mobile_no}`);
    res.status(200).json({ message: 'Profile and files deleted' });
  } catch (err) {
    logger.error(`[${requestId}] Profile delete error: ${err.message}`);
    next(err);
  }
};



exports.getMemberImage = async (req, res, next) => {
  console.log('getMemberImage, Query Params ', req.query);

  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId;
  const field_to_update = 'updatedCPImage';
  
  const currentWorkingDir = process.cwd();

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile) {
      logger.warn(`[${requestId}] No profile found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Constituency Profile Data not found' });
    }

    fname = profile.member_image;

    if (!fname) {
      logger.info(`[${requestId}] Image file is NULL for fetched profile of  ${leader_regd_mobile_no}`);
      return res.status(404).json('Alert! Member Image file is NULL');
    }
    logger.info(`[${requestId}] Fetched profile for ${leader_regd_mobile_no}`);
    //res.status(200).json(profile.fname);

    const imagePath = path.join(currentWorkingDir, 'uploads', 'constituency_images', fname);
    console.log('getMemberImage:-> ImagePath: ', imagePath);

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);

    res.sendFile(imagePath, err => {
      if (err) {
        console.error('Error sending image:', err.message);
        res.status(404).json({ message: 'Image not found or access denied' });
      }
    });

  } catch (err) {
    logger.error(`[${requestId}] Profile fetch error: ${err.message}`);
    next(err);
  }
};

//Update Member Image in Constituency Profile
// filed name: constituency_map
exports.updateMemberImage = async (req, res) => {
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const filename = req.file?.filename;

    console.log('updateMemberImage:  Request Body-LeaderMobile#:', leader_regd_mobile_no, ' Leader Image: ', filename );

    if (!filename) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const updatedLeader = await ConstituencyProfile.findOneAndUpdate(
      { leader_regd_mobile_no },
      { member_image: filename },
      { new: true, runValidators: true }
    );

    if (!updatedLeader) {
      return res.status(404).json({ error: 'Leader not found for given mobile number' });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPImage');

    res.status(200).json({
      message: 'Leader profile image updated successfully',
      leader_photo: filename
    });
  } catch (error) {
    res.status(400).json({
      error: 'Leader image update failed',
      details: error.message
    });
  }
};



// Delete member image
exports.deleteMemberImage = async (req, res, next) => {
  console.log('deleteConstituenceMemberImage: req.query: ', req.query);
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId;
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    //console.log('profile fetched: ', profile);
    if (!profile || !profile.member_image) {
      logger.warn(`[${requestId}] Member image delete failed: No image for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Image not found' });
    }

    fname = profile.member_image;

    if (!fname) {
      logger.info(`[${requestId}] Member Image file is NULL for fetched profile of  ${leader_regd_mobile_no}`);
      return res.status(404).json('Alert! Member Image file is NULL');
    }
  
    const imageWithPath = path.join('constituency_images', fname);
    console.log('deleteMemberImage:-> ImageWithPath: ', imageWithPath);

    //deleteFile(profile.member_image);
    const wasDeleted = deleteFile(imageWithPath);
    if (wasDeleted) {
      logger.info('File deletion confirmed: ', profile.member_image);
    
      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.member_image, field: 'memebr_image', requestId, userId });

      profile.member_image = null;
      await profile.save();

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPImage');


      logger.info(`[${requestId}] Member image deleted for ${leader_regd_mobile_no}`);
      res.status(200).json({ message: 'Image deleted' });
    } else {
      logger.warn('File deletion failed or file not found: ', profile.member_image);
      res.status(200).json({ message: 'File deletion failed or file not found' });
    }
  } catch (err) {
    logger.error(`[${requestId}] Member image delete error: ${err.message}`);
    next(err);
  }
};

// Get Map
exports.getConstituencyMap = async (req, res, next) => {
  console.log('getConstituencyMap, Query Params ', req.query);

  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId;
  const currentWorkingDir = process.cwd();
  const field_to_update = 'updatedCPMap';

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    if (!profile) {
      logger.warn(`[${requestId}] No profile found for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'Constituency Profile Data not found' });
    }

    fname = profile.constituency_map;

    if (!fname) {
      logger.info(`[${requestId}] constituency_map image file is NULL for fetched profile of  ${leader_regd_mobile_no}`);
      return res.status(404).json('Alert! constituency_map image file is NULL');
    }
    logger.info(`[${requestId}] Fetched profile for ${leader_regd_mobile_no}`);
    //res.status(200).json(profile.fname);

  //  const imagePath = path.join(__dirname, '..', 'uploads', 'constituency_images', fname);
    const imagePath = path.join(currentWorkingDir, 'uploads', 'constituency_images', fname);
    console.log('getConstituencyMap:-> ImagePath: ', imagePath);

    await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);

    res.sendFile(imagePath, err => {
      if (err) {
        console.error('Error sending image:', err.message);
        res.status(404).json({ message: 'constituency_map image not found or access denied' });
      }
    });

  } catch (err) {
    logger.error(`[${requestId}] Profile fetch error: ${err.message}`);
    next(err);
  }

};

//Update Member Image in Constituency Profile
// file name: member_image
exports.updateConstituencyMap= async (req, res) => {
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const filename = req.file?.filename;

    console.log('updateConstituencyMap:  Request Body-LeaderMobile#:', leader_regd_mobile_no, ' constituency_map: ', filename );

    if (!filename) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const updatedLeader = await ConstituencyProfile.findOneAndUpdate(
      { leader_regd_mobile_no },
      { constituency_map: filename },
      { new: true, runValidators: true }
    );

    if (!updatedLeader) {
      return res.status(404).json({ error: 'Leader not found for given mobile number' });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPMap');

    res.status(200).json({
      message: 'constituency_map image updated successfully',
      leader_photo: filename
    });
  } catch (error) {
    res.status(400).json({
      error: 'constituency_map image update failed',
      details: error.message
    });
  }
};


// Delete Map
exports.deleteConstituencyMap = async (req, res, next) => {
  console.log('deleteConstituenceMemberImage: req.query: ', req.query);
  const leader_regd_mobile_no = req.query.leader_regd_mobile_no;
  const requestId = req.requestId;
  const userId = req.headers['x-user-id'] || 'anonymous';

  try {
    const profile = await ConstituencyProfile.findOne({ leader_regd_mobile_no });
    //console.log('profile fetched: ', profile);

    if (!profile ) {
      logger.warn(`[${requestId}] constituency_map delete failed: No image for ${leader_regd_mobile_no}`);
      return res.status(404).json({ error: 'constituency_map image not found' });
    }

    fname = profile.constituency_map;

    if (!fname) {
      logger.info(`[${requestId}] constituency_map image file is NULL for fetched profile of  ${leader_regd_mobile_no}`);
      return res.status(404).json('Alert! constituency_map image file is NULL');
    }
  
    const imageWithPath = path.join('constituency_images', fname);
    console.log('deleteMemberImage:-> ImageWithPath: ', imageWithPath);

    const wasDeleted = deleteFile(imageWithPath);
    if (wasDeleted) {
      logger.info('File deletion confirmed: ', profile.constituency_map);

      await logFileChange({ leader_regd_mobile_no, action: 'Deleted', filename: profile.constituency_map, field: 'constituency_map', requestId, userId });

      profile.constituency_map = null;
      await profile.save();

      // 06/01/2026  -- Implemented update status = True logic 
      // in UpdateTrackerModel and BootstrapLog Collections
      await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedCPMap');


      logger.info(`[${requestId}] constituency_map deleted for ${leader_regd_mobile_no}`);
      res.status(200).json({ message: 'constituency_map image deleted' });
    } else {
      logger.warn('File deletion failed or file not found: ', profile.constituency_map);
      res.status(200).json({ message: 'File deletion failed or file not found' });
    }
  } catch (err) {
    logger.error(`[${requestId}] constituency_map image delete error: ${err.message}`);
    next(err);
  }
};

/**
 * 🧹 Deletes a file from disk if it exists.
 * @param {string} relativePath - Relative path from /uploads directory.
 * @returns {boolean} - True if file was deleted, false if not found.
 */
/*const deleteFile = (relativePath) => {
  const currentWorkingDir = process.cwd();
  const fullPath = path.join(currentWorkingDir, 'uploads', 'constituency_images', relativePath);
  //const fullPath = path.join(__dirname, '..', 'uploads', 'constituency_images', relativePath);

  logger.debug(`deleteFile invoked for: ${relativePath}`);
  logger.debug(`Resolved full path: ${fullPath}`);
  logger.info(`deleteFile invoked for: ${relativePath}`, '  :  ', `Resolved full path: ${fullPath}`);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`🧹 Deleted file: ${relativePath}`);
      return true;
    } else {
      logger.warn(`🧹 File not found: ${relativePath}`);
      return false;
    }
  } catch (error) {
    logger.error(`🧹 Error deleting file ${relativePath}: ${error.message}`, { stack: error.stack });
    return false;
  }
};

module.exports = { deleteFile };


// 🧹 Helper to delete file from disk
const deleteFile = (relativePath) => {
  const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
  console.log('deleteFile: fullPath: ', fullPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.info(`🧹 Deleted file: ${relativePath}`);
    return true;
  } else {
    console.log('Image file not found: ', relativePath);
    return false;
  }
};
*/



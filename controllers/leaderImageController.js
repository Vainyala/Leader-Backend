const LeaderCoordinates = require('../models/LeaderCoordinates');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
const path = require('path');

exports.getLeaderProfileImage = async (req, res) => {
  const filename = req.query.leader_image;
  console.log('getLeaderProfileImage......', filename);
  const currentWorkingDir = process.cwd();
  const field_to_update = 'updatedLeaderImage';

  //const imagePath = path.join(__dirname, '..', 'uploads', 'leader_images', filename);
  const imagePath = path.join(currentWorkingDir, 'uploads', 'leader_images', filename);

  console.log('getLeaderProfileImage:-> ImagePath: ', imagePath);

  await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
  
  res.sendFile(imagePath, err => {
    if (err) {
      console.error('Error sending image:', err.message);
      res.status(404).json({ message: 'Image not found or access denied' });
    }
  });
};

//Update Leader Profile Image - Leader Coordinates Coordinates
exports.updateLeaderProfileImage = async (req, res) => {
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    const filename = req.file?.filename;

    console.log('updateLeaderProfileImage:  Request Body-LeaderMobile#:', leader_regd_mobile_no, ' Image Filename: ', filename );

    if (!filename) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (req.user_type === 'user') {
      return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
    }

    const updatedLeader = await LeaderCoordinates.findOneAndUpdate(
      { leader_regd_mobile_no },
      { leader_photo: filename },
      { new: true, runValidators: true }
    );

    if (!updatedLeader) {
      return res.status(404).json({ error: 'Leader not found for given mobile number' });
    }

    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');
   
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


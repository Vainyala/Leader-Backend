// /controllers/leaderImageController.js

// 09/07/2026 --------
const { config } = require('dotenv');
const fs = require("fs").promises;
const path = require("path");
// -----------------------------------

const LeaderCoordinates = require('../models/LeaderCoordinates');

const { 
  updateTrackerFieldTrue,
  updateTrackerFieldFalse
} = require('../utils/updateTracker'); // 05/01/2026
  
// 09/07/2026 --------
const deleteFile = async (fullPath) => {
  try {
    await fs.unlink(fullPath);
    console.log(`Deleted file: ${fullPath}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`File not found: ${fullPath}`);
    } else {
      console.log(`Failed to delete file ${fullPath}: ${err.message}`);
    }
  }
};
// -----------------------------------

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
  let filename;   // 09/07/2026
  try {
    const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    filename = req.file?.filename; // Removed const ---- 09/07/2026

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
      { new: false, runValidators: true }
    );  // Notice: new: changed to false from true

    if (!updatedLeader) {
      return res.status(404).json({ error: 'Leader not found for given mobile number' });
    }
    
    // 06/01/2026  -- Implemented update status = True logic 
    // in UpdateTrackerModel and BootstrapLog Collections
    await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');
   
    // 09/07/2026 ---- Update successfull -- Delete old image as new image uploaded
    if (filename && updatedLeader.leader_photo) {
      const oldImagePath = path.resolve(process.env.LEADER_COORDINATES_PATH, updatedLeader.leader_photo);
      await deleteFile(oldImagePath)
    }
    // -----------------------------------
    
    res.status(200).json({
      message: 'Leader profile image updated successfully',
      leader_photo: filename
    });
  } catch (error) {

    // Delete uploaded image as error occured, so latest image upload failed.
      const newImagePath = path.resolve(process.env.LEADER_COORDINATES_PATH, filename);
      await deleteFile(newImagePath)
    // -----------------------------------


    res.status(400).json({
      error: 'Leader image update failed',
      details: error.message
    });
  }
};
















// const LeaderCoordinates = require('../models/LeaderCoordinates');

// const { 
//   updateTrackerFieldTrue,
//   updateTrackerFieldFalse
// } = require('../utils/updateTracker'); // 05/01/2026
  
// const path = require('path');

// exports.getLeaderProfileImage = async (req, res) => {
//   const filename = req.query.leader_image;
//   console.log('getLeaderProfileImage......', filename);
//   const currentWorkingDir = process.cwd();
//   const field_to_update = 'updatedLeaderImage';

//   //const imagePath = path.join(__dirname, '..', 'uploads', 'leader_images', filename);
//   const imagePath = path.join(currentWorkingDir, 'uploads', 'leader_images', filename);

//   console.log('getLeaderProfileImage:-> ImagePath: ', imagePath);

//   await updateTrackerFieldFalse(leader_regd_mobile_no, req.device_aaid, req.device_fingerprint, field_to_update);
  
//   res.sendFile(imagePath, err => {
//     if (err) {
//       console.error('Error sending image:', err.message);
//       res.status(404).json({ message: 'Image not found or access denied' });
//     }
//   });
// };

// //Update Leader Profile Image - Leader Coordinates Coordinates
// exports.updateLeaderProfileImage = async (req, res) => {
//   try {
//     const leader_regd_mobile_no = req.body.leader_regd_mobile_no;
//     const filename = req.file?.filename;

//     console.log('updateLeaderProfileImage:  Request Body-LeaderMobile#:', leader_regd_mobile_no, ' Image Filename: ', filename );

//     if (!filename) {
//       return res.status(400).json({ error: 'No image file uploaded' });
//     }

//     if (req.user_type === 'user') {
//       return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
//     }

//     const updatedLeader = await LeaderCoordinates.findOneAndUpdate(
//       { leader_regd_mobile_no },
//       { leader_photo: filename },
//       { new: true, runValidators: true }
//     );

//     if (!updatedLeader) {
//       return res.status(404).json({ error: 'Leader not found for given mobile number' });
//     }

//     // 06/01/2026  -- Implemented update status = True logic 
//     // in UpdateTrackerModel and BootstrapLog Collections
//     await updateTrackerFieldTrue(leader_regd_mobile_no, 'updatedSM');
   
//     res.status(200).json({
//       message: 'Leader profile image updated successfully',
//       leader_photo: filename
//     });
//   } catch (error) {
//     res.status(400).json({
//       error: 'Leader image update failed',
//       details: error.message
//     });
//   }
// };


const User = require('../models/User');
const path = require('path');
const fs = require("fs").promises;
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

exports.getUserProfileImage = (req, res) => {
  const filename = req.query.profile_image;
  console.log('getUserProfileImage......', filename);
  const currentWorkingDir = process.cwd();

  console.log('getUserProfileImage:-> Current Working Directory: ', currentWorkingDir);
  //const imagePath = path.join(__dirname, '..', 'uploads', 'profile_images', filename);
  const imagePath = path.join(currentWorkingDir, 'uploads', 'profile_images', filename);

  console.log('getProfileImage:-> ImagePath: ', imagePath);

  res.sendFile(imagePath, err => {
    if (err) {
      console.error('Error sending image:', err.message);
      res.status(404).json({ message: 'Image not found or access denied' });
    }
  });
};

// Upload User Profile Image
exports.updateUserProfileImage = async (req, res) => {
  let filename; 
  try {
    const { user_email_id } = req.body;
    filename = req.file?.filename;

    console.log('updateUserProfileImage:  Req Body:', req.body, ' Image Filename: ', filename);

    if (!filename) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_email_id: user_email_id.toLowerCase().trim() },
      { profile_image: filename },
      { new: false, runValidators: true }
    );
    console.log('updateUserProfileImage: updatedUser: ', updatedUser);

   if (!updatedUser) {
      // Delete newly uploaded image because user doesn't exist
      const newImagePath = path.resolve(
        process.env.PROFILE_IMAGES_PATH,
        filename
      );
      await deleteFile(newImagePath);

      return res.status(404).json({
        error: 'User not found for given email ID'
      });
    }

    // 09/07/2026 ---- Update successfull -- Delete old image as new image uploaded
    if (filename && updatedUser.profile_image) {
      const oldImagePath = path.resolve(process.env.PROFILE_IMAGES_PATH, 
        updatedUser.profile_image);
      await deleteFile(oldImagePath)
    }
    
    res.status(200).json({
      message: 'User profile image updated successfully',
      profile_image: filename
    });
  } catch (error) {
    console.error('Error updating user profile image:', error.message);

      // Delete newly uploaded image if DB update failed
    if (filename) {
      const newImagePath = path.resolve(
        process.env.PROFILE_IMAGES_PATH,
        filename
      );

      await deleteFile(newImagePath);
    }

    res.status(400).json({
      error: 'User image update failed',
      details: error.message
    });
  }
};


// 02/Nov/2025
// Get & Post APIs for testing MHA PDF documents - Fetch and Upload actions

exports.getUserDocument = (req, res) => {
  const filename = req.query.profile_doc;
  console.log('getUserDocument......', filename);
  const currentWorkingDir = process.cwd();

  //const imagePath = path.join(__dirname, '..', 'uploads', 'profile_images', filename);
  const imagePath = path.join(currentWorkingDir, 'uploads', 'profile_documents', filename);

  console.log('getUserDocument:-> DocumentPath: ', imagePath);

  res.sendFile(imagePath, err => {
    if (err) {
      console.error('Error sending document:', err.message);
      res.status(404).json({ message: 'Document not found or access denied' });
    }
  });
};

// Upload User Profile Image
exports.uploadUserDocument = async (req, res) => {
  try {
    const { user_email_id } = req.body;
    const filename = req.file?.filename;

    console.log('uploadUserDocument:  Req Body:', req.body, ' Document Filename: ', filename);

    if (!filename) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: user_email_id },
      { profile_image: filename },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found for given email ID' });
    }

    res.status(200).json({
      message: 'User Document uploaded successfully',
      profile_image: filename
    });
  } catch (error) {
    res.status(400).json({
      error: 'User Document upload failed',
      details: error.message
    });
  }
};













// const User = require('../models/User');
// const path = require('path');

// exports.getUserProfileImage = (req, res) => {
//   const filename = req.query.profile_image;
//   console.log('getUserProfileImage......', filename);
//   const currentWorkingDir = process.cwd();
// console.log('getUserProfileImage:-> Current Working Directory: ', currentWorkingDir);
//   //const imagePath = path.join(__dirname, '..', 'uploads', 'profile_images', filename);
//   const imagePath = path.join(currentWorkingDir, 'uploads', 'profile_images', filename);

//   console.log('getProfileImage:-> ImagePath: ', imagePath);

//   res.sendFile(imagePath, err => {
//     if (err) {
//       console.error('Error sending image:', err.message);
//       res.status(404).json({ message: 'Image not found or access denied' });
//     }
//   });
// };

// // Upload User Profile Image
// exports.updateUserProfileImage = async (req, res) => {
//   try {
//     const { user_email_id } = req.body;
//     const filename = req.file?.filename;

//     console.log('updateUserProfileImage:  Req Body:', req.body, ' Image Filename: ', filename);

//     if (!filename) {
//       return res.status(400).json({ error: 'No image file uploaded' });
//     }

//     const updatedUser = await User.findOneAndUpdate(
//       { user_email_id: user_email_id.toLowerCase().trim() },
//       { profile_image: filename },
//       { new: true, runValidators: true }
//     );
//     console.log('updateUserProfileImage: updatedUser: ', updatedUser);

//     if (!updatedUser) {
//       return res.status(404).json({ error: 'User not found for given email ID' });
//     }

//     res.status(200).json({
//       message: 'User profile image updated successfully',
//       profile_image: filename
//     });
//   } catch (error) {
//     console.error('Error updating user profile image:', error.message);
//     res.status(400).json({
//       error: 'User image update failed',
//       details: error.message
//     });
//   }
// };


// // 02/Nov/2025
// // Get & Post APIs for testing MHA PDF documents - Fetch and Upload actions

// exports.getUserDocument = (req, res) => {
//   const filename = req.query.profile_doc;
//   console.log('getUserDocument......', filename);
//   const currentWorkingDir = process.cwd();

//   //const imagePath = path.join(__dirname, '..', 'uploads', 'profile_images', filename);
//   const imagePath = path.join(currentWorkingDir, 'uploads', 'profile_documents', filename);

//   console.log('getUserDocument:-> DocumentPath: ', imagePath);

//   res.sendFile(imagePath, err => {
//     if (err) {
//       console.error('Error sending document:', err.message);
//       res.status(404).json({ message: 'Document not found or access denied' });
//     }
//   });
// };

// // Upload User Profile Image
// exports.uploadUserDocument = async (req, res) => {
//   try {
//     const { user_email_id } = req.body;
//     const filename = req.file?.filename;

//     console.log('uploadUserDocument:  Req Body:', req.body, ' Document Filename: ', filename);

//     if (!filename) {
//       return res.status(400).json({ error: 'No image file uploaded' });
//     }

//     const updatedUser = await User.findOneAndUpdate(
//       { email: user_email_id },
//       { profile_image: filename },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ error: 'User not found for given email ID' });
//     }

//     res.status(200).json({
//       message: 'User Document uploaded successfully',
//       profile_image: filename
//     });
//   } catch (error) {
//     res.status(400).json({
//       error: 'User Document upload failed',
//       details: error.message
//     });
//   }
// };


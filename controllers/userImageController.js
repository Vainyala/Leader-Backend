const User = require('../models/User');
const path = require('path');

exports.getUserProfileImage = (req, res) => {
  const filename = req.query.profile_image;
  console.log('getUserProfileImage......', filename);
  const currentWorkingDir = process.cwd();

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
  try {
    const { user_email_id } = req.body;
    const filename = req.file?.filename;

    console.log('updateUserProfileImage:  Req Body:', req.body, ' Image Filename: ', filename );

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
      message: 'User profile image updated successfully',
      profile_image: filename
    });
  } catch (error) {
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

    console.log('uploadUserDocument:  Req Body:', req.body, ' Document Filename: ', filename );

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


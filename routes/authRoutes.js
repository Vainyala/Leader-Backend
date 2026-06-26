const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Use this code to save user profile and leader profile images into the same folder: uploads/profile_images
// const upload = require('../config/multerv1'); // Have configured multer here

// Code for dynamic folder creation and file upload
const path = require('path');
const createUploader = require('../config/multerv2'); // Have configured multer here
const uploadProfileImage = createUploader('profile_images');
const validateAppKey = require('../middleware/validateAppKey');
const authenticate = require('../middleware/authenticate'); // JWT auth middleware

//console.log("authRoutes.js:  authController keys:", Object.keys(authController));

/* Code mapping to multerv1.js
router.post('/register', upload.single('profile_image'), async (req, res) => {
  try {
    req.body.profile_image = req.file?.path || null;
    await authController.register(req, res);
  } catch (error) {
    res.status(400).json({ error: 'Upload failed', details: error.message });
  }
});
*/
 // Code for dynamic folder creation and image upload  mapping to multerv2.js
 router.post('/register', uploadProfileImage.single('profile_image'), validateAppKey, async (req, res) => {
  try {
    //req.body.profile_image = req.file?.path || null;  // Absolute path mapping
    // ✅ Store relative path instead of full system path
    req.body.profile_image = req.file
      ? path.join('profile_images', req.file.filename)
      : null;
    await authController.register(req, res);
  } catch (error) {
    res.status(400).json({ error: 'User Profile Image Upload failed', details: error.message });
  }
});


router.post('/verifyemail', validateAppKey, authController.verifyEmail);
router.post('/sendotp', validateAppKey, authController.sendOTP);
router.post('/verifyemailotp', validateAppKey, authController.verifyEmailOTP);

router.post('/login', validateAppKey, authController.login);
router.post('/refreshtoken', validateAppKey, authenticate, authController.refreshToken);
router.post('/logout', validateAppKey, authenticate, authController.logout);

module.exports = router;
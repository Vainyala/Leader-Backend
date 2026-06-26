const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey');

//const { viewProfile, editProfile } = require('../controllers/userController');
const authenticate = require('../middleware/authenticate'); // JWT auth middleware
const upload = require('../config/multerv1'); // Centralized multer config
const userController = require('../controllers/userController');
const { 
    viewProfile, 
    editProfile, 
    changePassword, 
    forgotPassword, 
    viewProfileDocument,
    verifyEmail, 
    sendOTP,
    verifyEmailOTP 
  } = userController;

//console.log("userRoutes.js for view/edit profile: userController keys:", Object.keys(userController));

// View profile (GET)
router.get('/profile', validateAppKey, authenticate, viewProfile);

// Edit profile with optional image upload (PUT)
router.put('/profile',  validateAppKey, authenticate, upload.single('profile_image'), editProfile);

// Edit Profile with Image Upload

router.post('/profile',  upload.single('profile_image'), validateAppKey, authenticate, async (req, res) => {
  try {
    req.body.profile_image = req.file?.path || null;
    await userController.editProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: 'Upload failed', details: error.message });
  }
}, editProfile);

/* Doesnt work if call Multer after validateAppKey and authenticate

router.post('/profile', validateAppKey, authenticate, async (req, res) => {
  upload.single('profile_image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload failed', details: err.message });
    }

    try {
      // Attach image path to body if uploaded
      req.body.profile_image = req.file?.path || null;

      // ✅ Call controller to handle profile update
      await userController.editProfile(req, res);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });
});
*/

// Change Password  -- 29/10/2025
router.put('/profile/cp',  validateAppKey, authenticate, changePassword);

//  02/11/2025 --- Routes to get URL of a document
// Get Profile Document URL
router.get('/profile/documents', validateAppKey, authenticate, viewProfileDocument);

// 26/11/2025 -- Added to handle Forgot Password workflow
router.post('/profile/verifyemail', validateAppKey, verifyEmail);
router.post('/profile/sendotp', validateAppKey, sendOTP);
router.post('/profile/verifyemailotp', validateAppKey, verifyEmailOTP);

// Forgot Password  -- 29/10/2025
router.put('/profile/fp',  validateAppKey, forgotPassword);

module.exports = router;

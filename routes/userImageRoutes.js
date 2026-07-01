const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const uploadUserImage = require('../config/multerv4')('profile_images');
const validateAppKey = require('../middleware/validateAppKey');

//02/11/2025
const uploadDocument = require('../config/multer_doc')('profile_documents');

const { getUserProfileImage } = require('../controllers/userImageController');
const { updateUserProfileImage } = require('../controllers/userImageController');
const { getUserDocument } = require('../controllers/userImageController');
const { uploadUserDocument } = require('../controllers/userImageController');

// Secure image access route -- 13/09/2025
router.get('/image', validateAppKey, authenticate, getUserProfileImage);

router.put('/image', uploadUserImage.single('profile_image'), validateAppKey, authenticate, 
updateUserProfileImage);
//router.put( authenticate, uploadUserImage.single('profile_image'), updateUserProfileImage);

// Secure image access route -- 13/09/2025
router.get('/documents', validateAppKey, authenticate, getUserDocument);

router.put('/documents', uploadDocument.single('profile_doc'), validateAppKey, authenticate, uploadUserDocument);

module.exports = router;

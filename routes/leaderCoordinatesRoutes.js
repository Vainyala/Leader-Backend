const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

// Use this code to save user profile and leader profile images into the same folder: uploads/profile_images
//const upload = require('../config/multerv1'); // Centralized multer config

// Code for Dynamic folder creation and image uploading , use this code
const path = require('path');
const createUploader = require('../config/multerv2'); // Centralized multer config
const uploadLeaderImage = createUploader('leader_images');

console.log("leaderCoordinatesRoutes loaded");

router.get('/:mobile', (req, res, next) => {
  console.log("GET /api/coordinates/:mobile hit with", req.params.mobile);
  next(); // Pass to controller
});

const {
  fetchMembercoordinates,
  createMembercoordinates,
  updateMembercoordinates,
  deleteMembercoordinates
} = require('../controllers/leaderCoordinatesController');

// Optional: Debugging export keys
// console.log("leaderCoordinatesController keys:", Object.keys(require('../controllers/leaderCoordinatesController')));

router.get('/', validateAppKey, fetchMembercoordinates);

/*
// Code for no dynamic folder but image upload pointing to multerv1.js
router.post('/', upload.single('leader_photo'), async (req, res) => {
  try {
    req.body.leader_photo = req.file?.path || null;
    await createMembercoordinates(req, res);
  } catch (error) {
    res.status(400).json({ error: 'Leader Profile Image Upload failed', details: error.message });
  }
}, createMembercoordinates);

*/

// Commented on 27/Sep/2025
// There was always issues with handling image upload so removed image upload
// To be diagnosed and tesed in future
// Presently use seprate API to uploda Image
/*
router.post('/', uploadLeaderImage.single('leader_image'), async (req, res) => {
  try {
// ✅ Store relative path instead of full system path
    req.body.leader_photo = req.file
      ? path.join('leader_images', req.file.filename)
      : null;
    await validateAppKey, authenticate, createMembercoordinates(req, res);
  } catch (error) {
    res.status(400).json({ error: 'Leader Profile Image Upload failed', details: error.message });
  }
});
validateAppKey, authenticate, createMembercoordinates);
*/

// Create Member Coordinates without uploading Member Image
router.post('/', validateAppKey, authenticate, createMembercoordinates);

router.put('/', validateAppKey, authenticate, updateMembercoordinates);
router.delete('/', validateAppKey, authenticate, deleteMembercoordinates);

module.exports = router;

/*  Below code using multer directly into routes...

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// 🗂️ Setup storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 🛠️ Route with multer middleware
router.post('/coordinates', upload.single('member_photo'), createMembercoordinates);

*/
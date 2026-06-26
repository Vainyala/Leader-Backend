// constituencyProfileRoutes.js
 
const express = require('express');
const router = express.Router();
const path = require('path');
/*
// 4 Oct 2025
const createUploader = require('../config/multer');
const uploadMap = createUploader('constituency_images', ['jpeg', 'jpg', 'png', 'gif', 'pdf']);
const uploadMemberImage = createUploader('leader_images', ['jpeg', 'jpg', 'png', 'gif']);

*/
const uploadLeaderImage = require('../config/multerv2')('constituency_images');
const uploadConstituencyMap = require('../config/multerv2')('constituency_images');
//const { extractRoutes } = require('../utils/extractRoutes');
//const { markDeviceDataRefreshFalse } = require('../utils/updateDeviceRefresh');

const { 
  createProfile, 
  getProfile, 
  updateProfile, 
  deleteProfile, 
  getMemberImage, 
  updateMemberImage,
  deleteMemberImage,
  getConstituencyMap,
  updateConstituencyMap,
  deleteConstituencyMap
} = require('../controllers/ConstituenciesProfileController');

const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

console.log(' constituencyProfile router loaded');

router.post('/', validateAppKey, authenticate, createProfile);
router.get('/', validateAppKey, getProfile);
router.put('/', validateAppKey, authenticate, updateProfile);
router.delete('/', validateAppKey, authenticate, deleteProfile);

// Member Image routes
router.get('/image', validateAppKey, getMemberImage);
router.put('/image', uploadLeaderImage.single('leader_image'), validateAppKey, authenticate, updateMemberImage );
router.delete('/image', validateAppKey, authenticate, deleteMemberImage);

// Constituency Map Routes
router.get('/map', validateAppKey, getConstituencyMap);
router.put('/map', uploadConstituencyMap.single('constituency_map'), validateAppKey, authenticate, updateConstituencyMap );
router.delete('/map', validateAppKey, authenticate, deleteConstituencyMap);

// Inspect routes -- Uncomment to debug the routes loaded
//const allRoutes = extractRoutes(router); 
//console.log(allRoutes);

module.exports = router;

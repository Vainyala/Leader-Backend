const express = require('express');
const path = require('path');
const router = express.Router();
const uploadLeaderImage = require('../config/multerv2')('leader_images');
const { getLeaderProfileImage, updateLeaderProfileImage } = require('../controllers/leaderImageController');
const validateAppKey = require('../middleware/validateAppKey');
const authenticate = require('../middleware/authenticate');

router.get('/', validateAppKey, getLeaderProfileImage);
router.put('/', uploadLeaderImage.single('leader_image'), validateAppKey, authenticate, updateLeaderProfileImage );

module.exports = router;

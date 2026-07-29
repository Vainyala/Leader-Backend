const express = require('express');
const router = express.Router();
const path = require('path');
const validateAppKey = require('../middleware/validateAppKey');
const authenticate = require('../middleware/authenticate');
const { recordSplashClick, getSplashAnnouncements }
 = require('../controllers/LeaderSplashMsgAnnouncementController');

router.post('/media-corner/respond', validateAppKey, authenticate, recordSplashClick);
router.get('/media-corner/responses', validateAppKey, authenticate, getSplashAnnouncements);

module.exports = router;
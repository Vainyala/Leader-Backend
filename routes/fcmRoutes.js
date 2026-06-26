const express = require('express');
const router = express.Router();
const { saveFcmToken } = require('../controllers/fcmController');

router.post('/save-token', saveFcmToken);

module.exports = router;
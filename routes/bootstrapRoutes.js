const express = require('express');
const router = express.Router();

const { bootstrap, deviceInfo } = require('../controllers/bootstrapController');

console.log(' bootstrap router loaded');

router.post('/', bootstrap);

module.exports = router;

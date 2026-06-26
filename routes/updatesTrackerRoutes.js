// routes/updatesTrackerRoutes.js

const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey');
const { getAllUpdatesStatus, getUpdateStatusByField, getDevicedatarefreshStatus } = require('../controllers/updatesTrackerController');

console.log('updatesTrackerRoutes called .....');

// Get all update statuses
router.get('/status', validateAppKey, getAllUpdatesStatus);


// Get status of device_data_refresh = true/false from BootstrapLog Collection
router.get('/devicedatarefresh', validateAppKey, getDevicedatarefreshStatus);

// Get status by specific field
router.get('/:field', validateAppKey, getUpdateStatusByField);

module.exports = router;

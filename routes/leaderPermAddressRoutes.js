const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

//const controller = require('../controllers/leaderPermAddressController');
//OR below to export the routes keys
const {
  fetchPermaddress,
  createPermaddress,
  updatePermaddress,
  deletePermaddress
} = require('../controllers/leaderPermAddressController');

// Optional: Debugging export keys
// console.log("leaderPermAddressRoutes:  Controller keys:", Object.keys(require('../controllers/leaderPermAddressController')));

router.get('/', validateAppKey, fetchPermaddress);
router.post('/', validateAppKey, authenticate, createPermaddress);
router.put('/', validateAppKey, authenticate, updatePermaddress);
router.delete('/', validateAppKey, authenticate, deletePermaddress);

module.exports = router;

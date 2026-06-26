const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

const {
  fetchPresaddress,
  createPresaddress,
  updatePresaddress,
  deletePresaddress
} = require('../controllers/leaderPresentAddressController');

// Optional: Debugging export keys
// console.log("leaderPresentAddressRoutes:  Controller keys:", Object.keys(require('../controllers/leaderPresentAddressController')));

router.get('/', validateAppKey, fetchPresaddress);
router.post('/', validateAppKey, authenticate, createPresaddress);
router.put('/', validateAppKey, authenticate, updatePresaddress);
router.delete('/', validateAppKey, authenticate, deletePresaddress);

module.exports = router;

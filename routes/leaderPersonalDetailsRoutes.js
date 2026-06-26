const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

const {
  fetchPersonaldetails,
  createPersonaldetails,
  updatePersonaldetails,
  deletePersonaldetails
} = require('../controllers/leaderPersonalDetailsController');


// Optional: Debugging export keys
// console.log("leaderPersonalDetailsController keys:", Object.keys(require('../controllers/leaderPersonalDetailsController')));

router.get('/', validateAppKey, fetchPersonaldetails);
router.post('/', validateAppKey, authenticate, createPersonaldetails);
router.put('/', validateAppKey, authenticate, updatePersonaldetails);
router.delete('/', validateAppKey, authenticate, deletePersonaldetails);

module.exports = router;


const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');

const {
  fetchSocialmedia,
  createSocialmedia,
  updateSocialmedia,
  deleteSocialmedia
} = require('../controllers/LeaderSocialMediaController');

// Optional: Debugging export keys
// console.log("leaderSocialMediaController keys:", Object.keys(require('../controllers/leaderSocialMediaController')));

router.get('/', validateAppKey, fetchSocialmedia);
router.post('/', validateAppKey, authenticate, createSocialmedia);
router.put('/', validateAppKey, authenticate, updateSocialmedia);
router.delete('/', validateAppKey, authenticate, deleteSocialmedia);

module.exports = router;

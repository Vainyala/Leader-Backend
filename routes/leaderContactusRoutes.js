const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');


const {
  fetchContactus,
  createContactus,
  updateContactus,
  deleteContactus
} = require('../controllers/leaderContactusController');


router.get('/', validateAppKey, fetchContactus);
router.post('/', validateAppKey, authenticate, createContactus);
router.put('/', validateAppKey, authenticate, updateContactus);
router.delete('/', validateAppKey, authenticate, deleteContactus);

module.exports = router;

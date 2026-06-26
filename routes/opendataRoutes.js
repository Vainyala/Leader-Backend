const express = require('express');
const router = express.Router();
const openDataController = require('../controllers/openDataController');

router.get("/", openDataController.getAllPincodes);
router.get("/:pincode", openDataController.getPincodeByCode);

module.exports = router;

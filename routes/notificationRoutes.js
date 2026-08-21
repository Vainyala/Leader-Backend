const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController.js");
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');
const fcmController = require("../controllers/fcmController.js");
// POST /api/notification/send
// Body: { emp_id, event }
router.post(
  '/save-token',
  validateAppKey,
  authenticate,
  fcmController.saveFcmToken
);
router.post(
  "/send",
  validateAppKey,
  authenticate,
  notificationController.sendNotificationAPI
);
// router.post("/send", notificationController.sendNotificationAPI);

module.exports = router;
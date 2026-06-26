const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController.js");

// POST /api/notification/send
// Body: { emp_id, event }
router.post("/send", notificationController.sendNotificationAPI);

module.exports = router;
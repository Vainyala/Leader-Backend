const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');
const validateAppKey = require('../middleware/validateAppKey');

router.post('/', validateAppKey, authenticate, controller.createAppointment);
router.get('/search', validateAppKey, authenticate, controller.findAppointment);
router.get('/', validateAppKey, authenticate, controller.getAllAppointments);
router.put('/', validateAppKey, authenticate, controller.updateAppointment);
router.delete('/', validateAppKey, authenticate, controller.deleteAppointment);
router.get('/count', validateAppKey, authenticate, controller.countAllAppointments);
router.get('/countstatus', validateAppKey, authenticate, controller.countAllAppointmentsbyStatus);
router.get('/status', validateAppKey, authenticate, controller.getAllAppointmentsbyStatus);

module.exports = router;

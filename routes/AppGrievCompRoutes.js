const express = require('express');
const router = express.Router();
const controller = require('../controllers/appGrievCompController');
const authenticate = require('../middleware/authenticate');
const validateAppKey = require('../middleware/validateAppKey');

router.post('/', validateAppKey, authenticate, controller.createAppGrievComp);
router.get('/search', validateAppKey, authenticate, controller.findAppGrievComp);
router.get('/', validateAppKey, authenticate, controller.getAllAppGrievComp);
router.put('/', validateAppKey, authenticate, controller.updateAppGrievComp);
router.delete('/', validateAppKey, authenticate, controller.deleteAppGrievComp);
router.get('/count', validateAppKey, authenticate, controller.countAllAppGrievComp);
router.get('/countstatus', validateAppKey, authenticate, controller.countAllAppGrievCompbyStatus);
router.get('/status', validateAppKey, authenticate, controller.getAllAppGrievCompbyTypenStatus);

module.exports = router;

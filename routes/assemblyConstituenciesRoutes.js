const express = require('express');
const router = express.Router();
const validateAppKey = require('../middleware/validateAppKey'); 
const authenticate = require('../middleware/authenticate');
const controller = require('../controllers/assemblyConstituenciesController');

router.post('/', validateAppKey, authenticate, controller.createAssemblyData);
router.get('/', validateAppKey, controller.getAssemblyData);
router.put('/', validateAppKey, authenticate, controller.updateAssemblyData);
router.delete('/', validateAppKey, authenticate, controller.deleteAssemblyData);

module.exports = router;


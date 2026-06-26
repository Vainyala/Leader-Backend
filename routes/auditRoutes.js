
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditController');

router.get('/json', controller.exportAsJSON);              // All logs (JSON)
router.get('/csv', controller.exportAsCSV);                // All logs (CSV)
router.get('/json', controller.exportFilteredJSON);        // Filtered logs (JSON)
router.get('/csv', controller.exportFilteredCSV);          // Filtered logs (CSV)
router.delete('/:id', controller.deleteAuditLog);          // Delete single log
router.post('/archive', controller.archiveAuditLogs);      // Archive logs before date

module.exports = router;
// routes/leaderRoutes.js
const express = require('express');
const router = express.Router();
const leaderController = require('../controllers/leaderController');

router.post('/', leaderController.createLeader);
router.get('/', leaderController.getAllLeaders);
router.get('/:field', leaderController.getSelected);
router.get('/:id', leaderController.getLeaderById);
router.put('/:id', leaderController.updateLeader);
router.delete('/:id', leaderController.deleteLeader);

module.exports = router;

// mediaCornerRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

// Multer configuration for dynamic folder 'media_corner'
const uploadMedia = require('../config/multerv2')('media_corner');

const {
  createMediaCorner,
  getMediaCorner,
  getMediaCornerImage,
  updateMediaCorner,
  deleteMediaCornerImage
} = require('../controllers/mediaCornerController');

const validateAppKey = require('../middleware/validateAppKey');
const authenticate = require('../middleware/authenticate');

// Route: Create Media Corner (with dynamic folder and relative path storage)
router.post(
  '/',
  uploadMedia.single('media_file'),
  validateAppKey,
  authenticate,
  async (req, res) => {
    try {
      req.body.media_file = req.file
        ? path.join('', req.file.filename)
        : null;

      await createMediaCorner(req, res);
    } catch (error) {
      res.status(400).json({
        error: 'Media Corner file upload failed',
        details: error.message
      });
    }
  }
);

// Route: Get Media Corner data by media_type
router.get('/', validateAppKey, getMediaCorner);

// Route: Get Media Corner Image
router.get('/asset/', getMediaCornerImage);

// Route: Update Media Corner Image
router.put(
  '/',
  uploadMedia.single('media_file'),
  validateAppKey,
  authenticate,
  async (req, res) => {
    try {
      req.body.media_file = req.file
        ? path.join('', req.file.filename)
        : null;

      await updateMediaCorner(req, res);
    } catch (error) {
      res.status(400).json({
        error: 'Media Corner file upload failed',
        details: error.message
      });
    }
  }
);

// Route: Delete Media Corner Image
router.delete('/', validateAppKey, authenticate, deleteMediaCornerImage);

module.exports = router;

// leaderDocumentRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

const uploadDocument = require('../config/multer_doc')('leader_documents');

const {
  uploadLeaderDocument,
  getLeaderDocuments,
  updateLeaderDocument,
  deleteLeaderDocument,
  downloadLeaderDocument
} = require('../controllers/leaderDocumentsController');

const validateAppKey = require('../middleware/validateAppKey');
const authenticate = require('../middleware/authenticate');

// Route: Upload Leader Document (with dynamic folder and relative path storage)
router.post(
  '/',
  uploadDocument.single('document_file'),
  validateAppKey,
  authenticate,
  async (req, res) => {
    try {
      req.body.document_file = req.file
        ? path.join('', req.file.filename)
        : null;

      await uploadLeaderDocument(req, res);
    } catch (error) {
      res.status(400).json({
        error: 'Document file upload failed',
        details: error.message
      });
    }
  }
);

// Route: Get Leader Document URL
router.get('/', validateAppKey, getLeaderDocuments);

// Route: Get Leader Document - Direct download
router.get('/asset/', validateAppKey, downloadLeaderDocument);

// Route: Update Media Corner Image
router.put(
  '/',
  uploadDocument.single('document_file'),
  validateAppKey,
  authenticate,
  async (req, res) => {
    try {
      req.body.document_file = req.file
        ? path.join('', req.file.filename)
        : null;

      await updateLeaderDocument(req, res);
    } catch (error) {
      res.status(400).json({
        error: 'Document file upload failed',
        details: error.message
      });
    }
  }
);

// Route: Delete Media Corner Image
router.delete('/', validateAppKey, authenticate, deleteLeaderDocument);

module.exports = router;

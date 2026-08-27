const express = require('express');
const router = express.Router();
const path = require('path');

// Multer configuration
const uploadMedia =
  require('../config/multerv2')('media_corner');


const {
  createMediaCorner,
  getMediaCorner,
  getMediaCornerImage,
  updateMediaCorner,
  deleteMediaCornerImage
} = require('../controllers/mediaCornerController');


const validateAppKey =
  require('../middleware/validateAppKey');

const authenticate =
  require('../middleware/authenticate');


// ============================================================
// CREATE MEDIA CORNER
// ============================================================
router.post(
  '/',
  uploadMedia.single('media_file'),
  validateAppKey,
  authenticate,

  async (req, res) => {

    try {

      req.body.media_file =
        req.file
          ? path.join('', req.file.filename)
          : null;


      await createMediaCorner(
        req,
        res
      );

    } catch (error) {

      res.status(400).json({

        error:
          'Media Corner file upload failed',

        details:
          error.message
      });
    }
  }
);


// ============================================================
// GET MEDIA CORNER
//
// Latest:
// GET /media-corner?leader_regd_mobile_no=xxx&media_type=LN&status=latest
//
// History:
// GET /media-corner?leader_regd_mobile_no=xxx&media_type=LN&status=history
// ============================================================
router.get(
  '/',
  validateAppKey,
  getMediaCorner
);


// ============================================================
// GET IMAGE / VIDEO
// ============================================================
router.get(
  '/asset/',
  getMediaCornerImage
);


// ============================================================
// UPDATE MEDIA CORNER
// ============================================================
router.put(
  '/',
  uploadMedia.single('media_file'),
  validateAppKey,
  authenticate,

  async (req, res) => {

    try {

      req.body.media_file =
        req.file
          ? path.join('', req.file.filename)
          : null;


      await updateMediaCorner(
        req,
        res
      );

    } catch (error) {

      res.status(400).json({

        error:
          'Media Corner file upload failed',

        details:
          error.message
      });
    }
  }
);


// ============================================================
// DELETE MEDIA CORNER
// ============================================================
router.delete(
  '/',
  validateAppKey,
  authenticate,
  deleteMediaCornerImage
);


module.exports = router;

















// // mediaCornerRoutes.js

// const express = require('express');
// const router = express.Router();
// const path = require('path');

// // Multer configuration for dynamic folder 'media_corner'
// const uploadMedia = require('../config/multerv2')('media_corner');

// const {
//   createMediaCorner,
//   getMediaCorner,
//   getMediaCornerImage,
//   updateMediaCorner,
//   deleteMediaCornerImage
// } = require('../controllers/mediaCornerController');

// const validateAppKey = require('../middleware/validateAppKey');
// const authenticate = require('../middleware/authenticate');

// // Route: Create Media Corner (with dynamic folder and relative path storage)
// router.post(
//   '/',
//   uploadMedia.single('media_file'),
//   validateAppKey,
//   authenticate,
//   async (req, res) => {
//     try {
//       req.body.media_file = req.file
//         ? path.join('', req.file.filename)
//         : null;

//       await createMediaCorner(req, res);
//     } catch (error) {
//       res.status(400).json({
//         error: 'Media Corner file upload failed',
//         details: error.message
//       });
//     }
//   }
// );

// // Route: Get Media Corner data by media_type
// router.get('/', validateAppKey, getMediaCorner);

// // Route: Get Media Corner Image
// router.get('/asset/', getMediaCornerImage);

// // Route: Update Media Corner Image
// router.put(
//   '/',
//   uploadMedia.single('media_file'),
//   validateAppKey,
//   authenticate,
//   async (req, res) => {
//     try {
//       req.body.media_file = req.file
//         ? path.join('', req.file.filename)
//         : null;

//       await updateMediaCorner(req, res);
//     } catch (error) {
//       res.status(400).json({
//         error: 'Media Corner file upload failed',
//         details: error.message
//       });
//     }
//   }
// );

// // Route: Delete Media Corner Image
// router.delete('/', validateAppKey, authenticate, deleteMediaCornerImage);

// module.exports = router;

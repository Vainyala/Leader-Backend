// userFeedbackRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

const uploadDocument =
  require('../config/multerv2')('user_feedbacks');


const {
  addUserFeedback,
  fetchUserFeedbacks,
  updateUserFeedback,
  downloadUserFeedbackFile,
  findUserFeedback,
  countAllUserFeedback,
  countAllUserFeedbackbyStatus,
  getAllUserFeedbackbyTypenStatus,
  deleteUserFeedback,
  deviceInfo
} = require('../controllers/userFeedbackController');


const validateAppKey =
  require('../middleware/validateAppKey');

const authenticate =
  require('../middleware/authenticate');


// ============================================================
// CREATE USER FEEDBACK / BUG
// ============================================================

router.post(
  '/',
  uploadDocument.single('uf_attachment'),
  validateAppKey,
  authenticate,

  async (req, res) => {

    try {

      req.body.uf_attachment =
        req.file
          ? path.join('', req.file.filename)
          : null;


      await addUserFeedback(
        req,
        res
      );

    } catch (error) {

      res.status(400).json({

        error:
          'Attachment upload failed',

        details:
          error.message
      });
    }
  }
);


// ============================================================
// GET USER FEEDBACKS
// ============================================================

router.get(
  '/',
  validateAppKey,
  authenticate,
  fetchUserFeedbacks
);


// ============================================================
// DOWNLOAD ATTACHMENT
// ============================================================

router.get(
  '/attachment/',
  validateAppKey,
  authenticate,
  downloadUserFeedbackFile
);


// ============================================================
// UPDATE USER FEEDBACK - ADMIN
// ============================================================

router.put(
  '/',
  validateAppKey,
  authenticate,
  updateUserFeedback
);


// ============================================================
// SEARCH
// ============================================================

router.get(
  '/search',
  validateAppKey,
  authenticate,
  findUserFeedback
);


// ============================================================
// COUNT BY TYPE
// ============================================================

router.get(
  '/count',
  validateAppKey,
  authenticate,
  countAllUserFeedback
);


// ============================================================
// FETCH BY TYPE + STATUS
// ============================================================

router.get(
  '/fetch',
  validateAppKey,
  authenticate,
  getAllUserFeedbackbyTypenStatus
);


// ============================================================
// COUNT BY TYPE + STATUS
// ============================================================

router.get(
  '/countstatus',
  validateAppKey,
  authenticate,
  countAllUserFeedbackbyStatus
);


// ============================================================
// DELETE
// ============================================================

router.delete(
  '/',
  validateAppKey,
  authenticate,
  deleteUserFeedback
);


// ============================================================
// DEVICE INFO
// ============================================================

router.post(
  '/deviceinfo',
  validateAppKey,
  authenticate,
  deviceInfo
);


module.exports = router;










// // userFeedbackRoutes.js

// const express = require('express');
// const router = express.Router();
// const path = require('path');

// const uploadDocument = require('../config/multerv2')('user_feedbacks');

// const {
//   addUserFeedback,
//   fetchUserFeedbacks,
//   updateUserFeedback,
//   downloadUserFeedbackFile,
//   findUserFeedback,
//   countAllUserFeedback,
//   countAllUserFeedbackbyStatus,
//   getAllUserFeedbackbyTypenStatus,
//   deleteUserFeedback,
//   deviceInfo
// } = require('../controllers/userFeedbackController');

// const validateAppKey = require('../middleware/validateAppKey');
// const authenticate = require('../middleware/authenticate');

// // Route: Upload Leader Document (with dynamic folder and relative path storage)
// router.post(
//   '/',
//   uploadDocument.single('uf_attachment'),
//   validateAppKey,
//   authenticate,
//   async (req, res) => {
//     try {
//       req.body.uf_attachment = req.file
//         ? path.join('', req.file.filename)
//         : null;

//       await addUserFeedback(req, res);
//     } catch (error) {
//       res.status(400).json({
//         error: 'Attachment upload failed',
//         details: error.message
//       });
//     }
//   }
// );

// // Route: Get all feedbacks of the User
// router.get('/', validateAppKey, authenticate, fetchUserFeedbacks);

// // Route: Get the Attchament - Direct download
// router.get('/attachment/', validateAppKey, authenticate, downloadUserFeedbackFile);


// // Route: Update User Feedback by Admin
// router.put( '/', validateAppKey, authenticate, updateUserFeedback );

// // 19 Nov 2025 -- API routes to manage the data at Admin level
// // Modelled in line with AppGrievComp APIs

// router.get('/search', validateAppKey, authenticate, findUserFeedback);

// router.get('/count', validateAppKey, authenticate, countAllUserFeedback);
// router.get('/fetch', validateAppKey, authenticate, getAllUserFeedbackbyTypenStatus);
// router.get('/countstatus', validateAppKey, authenticate, countAllUserFeedbackbyStatus);
// router.delete('/', validateAppKey, authenticate, deleteUserFeedback);

// // 20/11/2025 
// // Capture device info if the User reports a technical issue for analysis and debugging

// router.post('/deviceinfo', validateAppKey, authenticate, deviceInfo);
// module.exports = router;

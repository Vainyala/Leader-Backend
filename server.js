#!/usr/bin/env node
//require('dotenv').config();

const express = require('express');
//const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config;
const cors = require('cors');

// 24/08/2025 --- ConnectDB -- db.js
const connectDB = require('./db');

const multer = require('multer');
const morgan = require('morgan');

const setupSwagger = require('./utils/swagger');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');


// Static Image Routes
// Define static path in .env file  22/Oct/2025
//const mediaCornerPath = process.env.MEDIA_CORNER_PATH || path.join(process.cwd(), 'uploads', 'media_corner');


if (!process.env.USER_FEEDBACKS_PATH) {
  throw new Error('USER_FEEDBACKS_PATH not defined in .env or environment');
}

const mediaCornerPath      = path.resolve(process.env.MEDIA_CORNER_PATH);
const userProfileImagePath = path.resolve(process.env.PROFILE_IMAGES_PATH);
const leaderImagePath      = path.resolve(process.env.LEADER_COORDINATES_PATH);
const consMemberImagePath  = path.resolve(process.env.CONSTITUENCY_PROFILE_PATH);
const documentPath         = path.resolve(process.env.LEADER_DOCUMENTS_PATH);
const userFeedbackPath     = path.resolve(process.env.USER_FEEDBACKS_PATH);


/*
const mediaCornerPath      = process.env.MEDIA_CORNER_PATH;
const userProfileImagePath = process.env.PROFILE_IMAGES_PATH;
const leaderImagePath      = process.env.LEADER_COORDINATES_PATH;
const consMemberImagePath  = process.env.CONSTITUENCY_PROFILE_PATH;
const documentPath         = process.env.LEADER_DOCUMENTS_PATH;
const userFeedbackPath     = process.env.USER_FEEDBACKS_PATH;
*/

console.log('\nuserProfilePath > Image Path > Static Path from .env param: ', userProfileImagePath);
console.log('Leader Coordinates: Image Path > Static Path from .env param: ', leaderImagePath);
console.log('Constituency Profile: Image Path >  Static Path from .env param: ', consMemberImagePath);
console.log('Media_Corner > Static Path from .env param: ', mediaCornerPath);
console.log('Document > Static Path from .env param: ', documentPath);
console.log('User Feedbacks > Static Path from .env param: ', userFeedbackPath, '\n');

// Routes
const leaderRoutes = require('./routes/leaderRoutes');
const authRoutes = require('./routes/authRoutes');
const opendataRoutes = require('./routes/opendataRoutes');
const userRoutes = require('./routes/userRoutes');
const leaderCoordinatesRoutes = require('./routes/leaderCoordinatesRoutes');
const leaderSocialMediaRoutes = require('./routes/leaderSocialMediaRoutes');
const leaderPersonalDetailsRoutes = require('./routes/leaderPersonalDetailsRoutes');
const leaderEducationRoutes = require('./routes/leaderEducationRoutes');
const leaderPresentAddressRoutes = require('./routes/leaderPresentAddressRoutes');
const leaderPermAddressRoutes = require('./routes/leaderPermAddressRoutes');
const leaderContactusRoutes = require('./routes/leaderContactusRoutes');
const userImageRoutes = require('./routes/userImageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const fcmRoutes = require('./routes/fcmRoutes');
const leaderImageRoutes = require('./routes/leaderImageRoutes');
const leaderTimelineRoutes = require('./routes/leaderTimelineRoutes');

const constituencyProfileRoutes = require('./routes/constituencyProfileRoutes');
const assemblyConstituenciesRoutes = require('./routes/assemblyConstituenciesRoutes');
const auditRoutes = require('./routes/auditRoutes');

// 10/10/2025 -- Media Corner Routes
const mediaCornerRoutes = require('./routes/mediaCornerRoutes');

// 02/11/2025 -- Leader Documents Routes
const leaderDocumentRoutes = require('./routes/leaderDocumentRoutes');

// 12/11/2025 -- User Feedbacks 
const userFeedbackRoutes = require('./routes/userFeedbackRoutes');

// 24/08/2025
// Added SAMVAD Routes
const appGrievCompRoutes = require('./routes/AppGrievCompRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Bootstrap route added on 18 Aug 2025
const useragent = require('express-useragent');
const bootstrapRouter = require('./routes/bootstrapRoutes');

// 23/12/2025 -- Updates Tracker API
const updatesTrackerRoutes = require('./routes/updatesTrackerRoutes');



const PORT = process.env.PORT || 5000;
global.refreshTokens = [];

const app = express();

// Swagger Setup
setupSwagger(app);


// -------------------- Explicit CORS from .env --------------------
// Ensure CORS middleware runs before routes
// Define routes after CORS
// If register routes before app.use(cors(...)), the preflight may not be handled correctly.

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-key']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // <-- critical

// Core Middleware
// Add these lines BEFORE your routes or middleware
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For form submissions

app.use(requestId); // Inject requestId early
app.use(morgan((tokens, req, res) => {
  return `[${req.requestId}] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} - ${tokens['response-time'](req, res)} ms`;
}, {
  stream: {
    write: message => logger.info(message.trim())
  }
}));

// Log Incoming Requests (optional)
app.use((req, res, next) => {
  logger.info(`[${req.requestId}] Incoming ${req.method} ${req.originalUrl}`);
  next();
});

// Mount routes -- 13/09/2025 -- Added security using accessToken and user_email_id
app.use('/api/profile', userImageRoutes);

// 28-Sep-2025 -- Implemented secured access of leader image using app-key and accessToken
app.use('/api/leaderimage', leaderImageRoutes);

// Static Routes to access Images
//app.use('/api/profile', authenticate, express.static(path.join(__dirname, 'uploads/profile_images')));
//app.use('/api/leader', express.static(path.join(__dirname, 'uploads/leader_images')));
//app.use('/api/maps', express.static(path.join(__dirname, 'uploads/constituency_images')));
//app.use('/api/members', express.static(path.join(__dirname, 'uploads/leader_images')));


// 17-Oct-2025 --- Added static route to handle Media Corner image/video
//Add this before the static route to confirm it's being hit:
//app.use('/uploads/media_corner', (req, res, next) => {
  //console.log('Static request:', req.originalUrl);
  //next();
//});

//Log static hits with timestamps and IPs for traceability:
//app.use('/uploads/media_corner', (req, res, next) => {

app.use(userProfileImagePath, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
});

app.use(leaderImagePath, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
});

app.use(consMemberImagePath, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
});

app.use(mediaCornerPath, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
});

// Serve static files from /uploads/media_corner
//const static_path = (path.join(process.cwd(), 'uploads', 'media_corner'));

//app.use('/uploads/media_corner', express.static(path.join(process.cwd(), 'uploads', 'media_corner')));
//app.use('/media', express.static(path.join(process.cwd(), 'uploads', 'media_corner'))); //OR use below using .env param
app.use('/profile', express.static(userProfileImagePath));
app.use('/leader', express.static(leaderImagePath));
app.use('/constituency', express.static(consMemberImagePath));
app.use('/media', express.static(mediaCornerPath));


// 02/11/2025 -- Document routes
app.use('/document', express.static(documentPath));

// 12/11/2025 -- User Feedback routes
app.use('/userfeedbacks', express.static(userFeedbackPath));

// 🔗 API Routes

// 15-06-2026 -- notification routes
app.use("/api/notification", notificationRoutes);
app.use("/api/fcm", fcmRoutes);
// Bootstrap API entries - 18 Aug 2025
app.use(useragent.express());
app.use('/api/bootstrap', bootstrapRouter);

app.use('/api/leaders', leaderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pincodes', opendataRoutes);
app.use('/api', userRoutes);
app.use('/api/coordinates', leaderCoordinatesRoutes);
app.use('/api/socialmedia', leaderSocialMediaRoutes);
app.use('/api/personaldetails', leaderPersonalDetailsRoutes);
app.use('/api/edudata', leaderEducationRoutes);
app.use('/api/permaddress', leaderPermAddressRoutes);
app.use('/api/contactus', leaderContactusRoutes);
app.use('/api/preaddress', leaderPresentAddressRoutes);
//app.use('/api/userimage', userImageRoutes);
app.use('/api/leaderimage', leaderImageRoutes);
app.use('/api/leadertimeline', leaderTimelineRoutes);

app.use('/api/constituencyprofile', constituencyProfileRoutes);
app.use('/api/assemblyconstituencies', assemblyConstituenciesRoutes);

// Media Corner -- added on 10/10/2025
app.use('/api/mediacorner', mediaCornerRoutes);


// 02/11/2025
app.use('/api/document', leaderDocumentRoutes);

// 12/11/2025
app.use('/api/userfeedback', userFeedbackRoutes);


app.use('/api/audit', auditRoutes);

// 24/08/2025
// Added SAMVAD Routes
app.use('/api/grievances', appGrievCompRoutes);
app.use('/api/appointments', appointmentRoutes);


// 23/12/2025 -- Updates Tracker routes mounted
app.use('/api/updates', updatesTrackerRoutes);


// Health Check
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

// 404 Handler (optional)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Alert! Route not found' });
});

//  Multer & File Upload Error Handling
/*app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Multer error', details: err.message });
  } else if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Invalid file type', details: err.message });
  }
  next(err); // Pass to global error handler
});
*/

// Multer & File Upload Error Handling with requestId
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'N/A';

  if (err instanceof multer.MulterError) {
    // Multer-specific errors (e.g., file too large)
    logger.warn(`[${requestId}] Multer error: ${err.message}`);
    return res.status(400).json({
      error: 'Multer error',
      details: err.message,
      requestId
    });
  }

  if (err.message === 'Only image files (JPEG/JPG/PNG/GIF) are allowed!') {
    // Custom file type error from your fileFilter
    logger.warn(`[${requestId}] Invalid file type: ${err.message}`);
    return res.status(400).json({
      error: 'Invalid file type',
      details: err.message,
      requestId
    });
  }

  if (err) {
    // Generic errors during upload
    logger.error(`[${requestId}] Upload error: ${err.message}`);
    return res.status(500).json({
      error: 'Server error',
      details: err.message,
      requestId
    });
  }

  next(); // Pass to next middleware if no error
});

//  Global Error Handler
app.use(errorHandler); // Handles all uncaught errors centrally

// MongoDB Connection & Server Start
/*
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('MongoDB connected');
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}).catch(err => {
  logger.error(`MongoDB connection failed: ${err.message}`);
});
*/

// 24/08/2025
// Connect MongoDB --- db.js is called

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('Server startup aborted due to DB error');
    process.exit(1); // fail fast
  });












// #!/usr/bin/env node
// //require('dotenv').config();

// const express = require('express');
// //const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config;

// // 24/08/2025 --- ConnectDB -- db.js
// const connectDB = require('./db');

// const multer = require('multer');
// const morgan = require('morgan');

// const setupSwagger = require('./utils/swagger');
// const logger = require('./utils/logger');
// const requestId = require('./middleware/requestId');
// const errorHandler = require('./middleware/errorHandler');


// // Static Image Routes
// // Define static path in .env file  22/Oct/2025
// //const mediaCornerPath = process.env.MEDIA_CORNER_PATH || path.join(process.cwd(), 'uploads', 'media_corner');


// if (!process.env.USER_FEEDBACKS_PATH) {
//   throw new Error('USER_FEEDBACKS_PATH not defined in .env or environment');
// }

// const mediaCornerPath      = path.resolve(process.env.MEDIA_CORNER_PATH);
// const userProfileImagePath = path.resolve(process.env.PROFILE_IMAGES_PATH);
// const leaderImagePath      = path.resolve(process.env.LEADER_COORDINATES_PATH);
// const consMemberImagePath  = path.resolve(process.env.CONSTITUENCY_PROFILE_PATH);
// const documentPath         = path.resolve(process.env.LEADER_DOCUMENTS_PATH);
// const userFeedbackPath     = path.resolve(process.env.USER_FEEDBACKS_PATH);


// /*
// const mediaCornerPath      = process.env.MEDIA_CORNER_PATH;
// const userProfileImagePath = process.env.PROFILE_IMAGES_PATH;
// const leaderImagePath      = process.env.LEADER_COORDINATES_PATH;
// const consMemberImagePath  = process.env.CONSTITUENCY_PROFILE_PATH;
// const documentPath         = process.env.LEADER_DOCUMENTS_PATH;
// const userFeedbackPath     = process.env.USER_FEEDBACKS_PATH;
// */

// console.log('\nuserProfilePath > Image Path > Static Path from .env param: ', userProfileImagePath);
// console.log('Leader Coordinates: Image Path > Static Path from .env param: ', leaderImagePath);
// console.log('Constituency Profile: Image Path >  Static Path from .env param: ', consMemberImagePath);
// console.log('Media_Corner > Static Path from .env param: ', mediaCornerPath);
// console.log('Document > Static Path from .env param: ', documentPath);
// console.log('User Feedbacks > Static Path from .env param: ', userFeedbackPath, '\n');

// // Routes
// const leaderRoutes = require('./routes/leaderRoutes');
// const authRoutes = require('./routes/authRoutes');
// const opendataRoutes = require('./routes/opendataRoutes');
// const userRoutes = require('./routes/userRoutes');
// const leaderCoordinatesRoutes = require('./routes/leaderCoordinatesRoutes');
// const leaderSocialMediaRoutes = require('./routes/leaderSocialMediaRoutes');
// const leaderPersonalDetailsRoutes = require('./routes/leaderPersonalDetailsRoutes');
// const leaderEducationRoutes = require('./routes/leaderEducationRoutes');
// const leaderPresentAddressRoutes = require('./routes/leaderPresentAddressRoutes');
// const leaderPermAddressRoutes = require('./routes/leaderPermAddressRoutes');
// const leaderContactusRoutes = require('./routes/leaderContactusRoutes');
// const userImageRoutes = require('./routes/userImageRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const fcmRoutes = require('./routes/fcmRoutes');
// const leaderImageRoutes = require('./routes/leaderImageRoutes');
// const leaderTimelineRoutes = require('./routes/leaderTimelineRoutes');

// const constituencyProfileRoutes = require('./routes/constituencyProfileRoutes');
// const assemblyConstituenciesRoutes = require('./routes/assemblyConstituenciesRoutes');
// const auditRoutes = require('./routes/auditRoutes');

// // 10/10/2025 -- Media Corner Routes
// const mediaCornerRoutes = require('./routes/mediaCornerRoutes');

// // 02/11/2025 -- Leader Documents Routes
// const leaderDocumentRoutes = require('./routes/leaderDocumentRoutes');

// // 12/11/2025 -- User Feedbacks 
// const userFeedbackRoutes = require('./routes/userFeedbackRoutes');

// // 24/08/2025
// // Added SAMVAD Routes
// const appGrievCompRoutes = require('./routes/AppGrievCompRoutes');
// const appointmentRoutes = require('./routes/appointmentRoutes');

// // Bootstrap route added on 18 Aug 2025
// const useragent = require('express-useragent');
// const bootstrapRouter = require('./routes/bootstrapRoutes');

// // 23/12/2025 -- Updates Tracker API
// const updatesTrackerRoutes = require('./routes/updatesTrackerRoutes');



// const PORT = process.env.PORT || 5000;
// global.refreshTokens = [];

// const app = express();

// // Swagger Setup
// setupSwagger(app);

// // Core Middleware
// // Add these lines BEFORE your routes or middleware
// app.use(express.json()); // For JSON payloads
// app.use(express.urlencoded({ extended: true })); // For form submissions

// app.use(requestId); // Inject requestId early
// app.use(morgan((tokens, req, res) => {
//   return `[${req.requestId}] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} - ${tokens['response-time'](req, res)} ms`;
// }, {
//   stream: {
//     write: message => logger.info(message.trim())
//   }
// }));

// // Log Incoming Requests (optional)
// app.use((req, res, next) => {
//   logger.info(`[${req.requestId}] Incoming ${req.method} ${req.originalUrl}`);
//   next();
// });

// // Mount routes -- 13/09/2025 -- Added security using accessToken and user_email_id
// app.use('/api/profile', userImageRoutes);

// // 28-Sep-2025 -- Implemented secured access of leader image using app-key and accessToken
// app.use('/api/leaderimage', leaderImageRoutes);

// // Static Routes to access Images
// //app.use('/api/profile', authenticate, express.static(path.join(__dirname, 'uploads/profile_images')));
// //app.use('/api/leader', express.static(path.join(__dirname, 'uploads/leader_images')));
// //app.use('/api/maps', express.static(path.join(__dirname, 'uploads/constituency_images')));
// //app.use('/api/members', express.static(path.join(__dirname, 'uploads/leader_images')));


// // 17-Oct-2025 --- Added static route to handle Media Corner image/video
// //Add this before the static route to confirm it's being hit:
// //app.use('/uploads/media_corner', (req, res, next) => {
//   //console.log('Static request:', req.originalUrl);
//   //next();
// //});

// //Log static hits with timestamps and IPs for traceability:
// //app.use('/uploads/media_corner', (req, res, next) => {

// app.use(userProfileImagePath, (req, res, next) => {
//   console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
//   next();
// });

// app.use(leaderImagePath, (req, res, next) => {
//   console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
//   next();
// });

// app.use(consMemberImagePath, (req, res, next) => {
//   console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
//   next();
// });

// app.use(mediaCornerPath, (req, res, next) => {
//   console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
//   next();
// });

// // Serve static files from /uploads/media_corner
// //const static_path = (path.join(process.cwd(), 'uploads', 'media_corner'));

// //app.use('/uploads/media_corner', express.static(path.join(process.cwd(), 'uploads', 'media_corner')));
// //app.use('/media', express.static(path.join(process.cwd(), 'uploads', 'media_corner'))); //OR use below using .env param
// app.use('/profile', express.static(userProfileImagePath));
// app.use('/leader', express.static(leaderImagePath));
// app.use('/constituency', express.static(consMemberImagePath));
// app.use('/media', express.static(mediaCornerPath));


// // 02/11/2025 -- Document routes
// app.use('/document', express.static(documentPath));

// // 12/11/2025 -- User Feedback routes
// app.use('/userfeedbacks', express.static(userFeedbackPath));

// // 🔗 API Routes

// // 15-06-2026 -- notification routes
// app.use("/api/notification", notificationRoutes);
// app.use("/api/fcm", fcmRoutes);
// // Bootstrap API entries - 18 Aug 2025
// app.use(useragent.express());
// app.use('/api/bootstrap', bootstrapRouter);

// app.use('/api/leaders', leaderRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/pincodes', opendataRoutes);
// app.use('/api', userRoutes);
// app.use('/api/coordinates', leaderCoordinatesRoutes);
// app.use('/api/socialmedia', leaderSocialMediaRoutes);
// app.use('/api/personaldetails', leaderPersonalDetailsRoutes);
// app.use('/api/edudata', leaderEducationRoutes);
// app.use('/api/permaddress', leaderPermAddressRoutes);
// app.use('/api/contactus', leaderContactusRoutes);
// app.use('/api/preaddress', leaderPresentAddressRoutes);
// //app.use('/api/userimage', userImageRoutes);
// app.use('/api/leaderimage', leaderImageRoutes);
// app.use('/api/leadertimeline', leaderTimelineRoutes);

// app.use('/api/constituencyprofile', constituencyProfileRoutes);
// app.use('/api/assemblyconstituencies', assemblyConstituenciesRoutes);

// // Media Corner -- added on 10/10/2025
// app.use('/api/mediacorner', mediaCornerRoutes);


// // 02/11/2025
// app.use('/api/document', leaderDocumentRoutes);

// // 12/11/2025
// app.use('/api/userfeedback', userFeedbackRoutes);


// app.use('/api/audit', auditRoutes);

// // 24/08/2025
// // Added SAMVAD Routes
// app.use('/api/grievances', appGrievCompRoutes);
// app.use('/api/appointments', appointmentRoutes);


// // 23/12/2025 -- Updates Tracker routes mounted
// app.use('/api/updates', updatesTrackerRoutes);


// // Health Check
// app.get('/ping', (req, res) => {
//   res.status(200).json({ message: 'Server is alive' });
// });

// // 404 Handler (optional)
// app.use((req, res, next) => {
//   res.status(404).json({ error: 'Alert! Route not found' });
// });

// //  Multer & File Upload Error Handling
// /*app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: 'Multer error', details: err.message });
//   } else if (err.message === 'Only image files are allowed!') {
//     return res.status(400).json({ error: 'Invalid file type', details: err.message });
//   }
//   next(err); // Pass to global error handler
// });
// */

// // Multer & File Upload Error Handling with requestId
// app.use((err, req, res, next) => {
//   const requestId = req.requestId || 'N/A';

//   if (err instanceof multer.MulterError) {
//     // Multer-specific errors (e.g., file too large)
//     logger.warn(`[${requestId}] Multer error: ${err.message}`);
//     return res.status(400).json({
//       error: 'Multer error',
//       details: err.message,
//       requestId
//     });
//   }

//   if (err.message === 'Only image files (JPEG/JPG/PNG/GIF) are allowed!') {
//     // Custom file type error from your fileFilter
//     logger.warn(`[${requestId}] Invalid file type: ${err.message}`);
//     return res.status(400).json({
//       error: 'Invalid file type',
//       details: err.message,
//       requestId
//     });
//   }

//   if (err) {
//     // Generic errors during upload
//     logger.error(`[${requestId}] Upload error: ${err.message}`);
//     return res.status(500).json({
//       error: 'Server error',
//       details: err.message,
//       requestId
//     });
//   }

//   next(); // Pass to next middleware if no error
// });

// //  Global Error Handler
// app.use(errorHandler); // Handles all uncaught errors centrally

// // MongoDB Connection & Server Start
// /*
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   logger.info('MongoDB connected');
//   app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
// }).catch(err => {
//   logger.error(`MongoDB connection failed: ${err.message}`);
// });
// */

// // 24/08/2025
// // Connect MongoDB --- db.js is called

// // Connect DB and start server
// connectDB()
//   .then(() => {
//     app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
//   })
//   .catch(err => {
//     logger.error('Server startup aborted due to DB error');
//     process.exit(1); // fail fast
//   });

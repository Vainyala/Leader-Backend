const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File type filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG/JPG/PNG/GIFF/MP4) are allowed!'), false);
  }
};

// Factory function to create upload middleware with dynamic folder
const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join('uploads', folderName);

      // Ensure directory exists
      fs.mkdirSync(dir, { recursive: true });

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  return multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Max 2MB
    fileFilter: fileFilter
  });
};

module.exports = createUploader;

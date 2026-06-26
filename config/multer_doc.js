// Multer fucntions to upload documents - doc/pdf/xls/txt

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load base upload directory from .env
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Image file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /doc|docx|pdf|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only document files (doc/docx/pdf/txt) are allowed!'), false);
  }
};

// Factory function for dynamic folder uploads
const createUploader = (folderName = '') => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(BASE_UPLOAD_DIR, folderName);

      // Auto-create folder if missing
      fs.mkdirSync(dir, { recursive: true });

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter
  });
};

module.exports = createUploader;

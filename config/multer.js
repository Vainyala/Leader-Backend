const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// ✅ Enhanced file filter
const fileFilter = (allowedMimeTypes = []) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    const isValid = allowedMimeTypes.some(type => mime.includes(type) || ext.includes(type));
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`), false);
    }
  };
};

// ✅ Factory for dynamic folder uploads
const createUploader = (folderName = '', allowedTypes = ['jpeg', 'jpg', 'png', 'gif']) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(BASE_UPLOAD_DIR, folderName);
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
    fileFilter: fileFilter(allowedTypes)
  });
};

module.exports = createUploader;

// 24/10/2025
// utils/fileUtils.js
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
/**
 * Deletes a file from disk if it exists.
 * @param {string} relativePath - Relative path from /uploads directory.
 * @returns {boolean} - True if file was deleted, false otherwise.
 */
const deleteFile = (relativePath) => {
  try {
    const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
    logger.debug(`🧹 deleteFile: fullPath resolved as ${fullPath}`);
    logger.info(`🧹 deleteFile: fullPath resolved as ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`🧹 Deleted file: ${relativePath}`);
      return true;
    } else {
      logger.warn(`🧹 File not found: ${relativePath}`);
      return false;
    }
  } catch (error) {
    logger.error(`🧹 Error deleting file ${relativePath}: ${error.message}`, { stack: error.stack });
    return false;
  }
};

module.exports = { deleteFile };

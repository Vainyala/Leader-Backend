// db.js

require('dotenv').config(); // Ensure this is at the top

const mongoose = require('mongoose');
const logger = require('./utils/logger'); // adjust path as needed

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info(' MongoDB connected');
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
};
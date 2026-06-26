require('dotenv').config();
const mongoose = require('mongoose');
const BootstrapLog = require('../models/BootstrapLog');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

const args = process.argv.slice(2);
const filter = {};

if (args.includes('--success')) filter.result = 'success';
if (args.includes('--failure')) filter.result = 'failure';

(async () => {
  try {
    const logs = await BootstrapLog.find(filter).sort({ timestamp: -1 }).limit(50);
    console.log(`\n📋 Showing ${logs.length} bootstrap logs:\n`);

    logs.forEach(log => {
      console.log(`[${log.timestamp.toISOString()}] ${log.result.toUpperCase()} | IP: ${log.ip_address} | Fingerprint: ${log.device_fingerprint}`);
    });
  } catch (err) {
    console.error('❌ Error fetching logs:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();


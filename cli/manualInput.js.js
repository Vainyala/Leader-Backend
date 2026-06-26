require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const AppOwner = require('../models/AppOwner');
const CryptoService = require('../services/cryptoService');
const generateAppKey = require('../utils/generateAppKey');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getNextClientId() {
  try {
    const last = await AppOwner.findOne().sort({ client_id: -1 });
    return last ? last.client_id + 1 : 1001;
  } catch (err) {
    console.error('❌ Error fetching client_id:', err.message);
    return 1001;
  }
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const invoice_no = await askQuestion('📥 Invoice No: ');
    const invoice_date = await askQuestion('📅 Invoice Date (Unix Epoch): ');
    const client_name = await askQuestion('👤 Client Name: ');
    const email = await askQuestion('📧 Client Email: ');
    const mobile = await askQuestion('📱 Client Mobile: ');

    const encryptedEmail = CryptoService.encrypt(email);
    const encryptedMobile = CryptoService.encrypt(mobile);
    const client_id = await getNextClientId();
    const app_key = generateAppKey();

    const owner = new AppOwner({
      app_key,
      invoice_no,
      invoice_date,
      client_id,
      client_name,
      client_regd_email: encryptedEmail,
      client_regd_mobile_no: encryptedMobile
    });

    await owner.save();

    console.log(`✅ Saved AppOwnerInfo with app_key: ${app_key}`);
    console.log('📧 Input Email:', email);
    console.log('🔐 Encrypted Email:', encryptedEmail);
    console.log('📱 Input Mobile:', mobile);
    console.log('🔐 Encrypted Mobile:', encryptedMobile);

  } catch (err) {
    console.error('❌ Error saving AppOwnerInfo:', err.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
})();
